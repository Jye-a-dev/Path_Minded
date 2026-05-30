import { Pool, PoolClient } from 'pg';

export interface KbMappingRow {
  knowledge_block: string;
  label: string;
  phrases: string[];
}

export interface ParsedCourseItem {
  courseCode?: string | null;
  course_code?: string | null;
  courseName?: string | null;
  course_name?: string | null;
  credits?: number | null;
  expectedSemester?: number | null;
  expected_semester?: number | null;
  courseGroup?: string | null;
  course_group?: string | null;
  courseType?: string | null;
  course_type?: string | null;
  isRequired?: boolean;
  is_required?: boolean;
  theoryHours?: number | null;
  theory_hours?: number | null;
  practiceHours?: number | null;
  practice_hours?: number | null;
  projectHours?: number | null;
  project_hours?: number | null;
  internshipHours?: number | null;
  internship_hours?: number | null;
  prerequisite?: string | null;
  corequisite?: string | null;
  organizingSemester?: string | null;
  organizing_semester?: string | null;
  knowledgeBlock?: string | null;
  knowledge_block?: string | null;
}

export interface ParseWarningItem {
  rowNumber?: number | null;
  code?: string | null;
  message?: string | null;
  rawValue?: string | null;
}

export function resolveKB(
  groupName: string | null,
  kbMappings: KbMappingRow[],
  courseName?: string | null,
): string {
  const groupClean = (groupName || '').trim();

  if (groupClean) {
    // 1. Exact Code Match (e.g. "GENERAL", "MAJOR_CORE")
    const codeMatch = kbMappings.find(
      (m) => m.knowledge_block.toUpperCase() === groupClean.toUpperCase(),
    );
    if (codeMatch) return codeMatch.knowledge_block;

    // 2. Exact Label Match (e.g. "Đại cương", "Chuyên ngành")
    const labelMatch = kbMappings.find(
      (m) => m.label.trim().toLowerCase() === groupClean.toLowerCase(),
    );
    if (labelMatch) return labelMatch.knowledge_block;
  }

  // Build phrase list sorted longest-first to avoid substring conflicts
  const allPhrases: { phrase: string; knowledge_block: string }[] = [];
  for (const mapping of kbMappings) {
    if (Array.isArray(mapping.phrases)) {
      for (const phrase of mapping.phrases) {
        const phraseClean = phrase.trim().toLowerCase();
        if (phraseClean) {
          allPhrases.push({
            phrase: phraseClean,
            knowledge_block: mapping.knowledge_block,
          });
        }
      }
    }
  }
  allPhrases.sort((a, b) => b.phrase.length - a.phrase.length);

  // 3. Phrase match against groupName ONLY (highest confidence)
  const groupLower = groupClean.toLowerCase();
  if (groupLower) {
    for (const item of allPhrases) {
      if (groupLower.includes(item.phrase)) {
        return item.knowledge_block;
      }
    }
  }

  // 4. Phrase match against courseName as fallback (lower confidence)
  //    Only when groupName gave no result — avoids false positives for common words
  const nameLower = (courseName || '').toLowerCase();
  if (nameLower) {
    for (const item of allPhrases) {
      // Only use longer phrases (>= 5 chars) to reduce false positives from short words
      if (item.phrase.length >= 5 && nameLower.includes(item.phrase)) {
        return item.knowledge_block;
      }
    }
  }

  return 'GENERAL';
}

export async function ensureDbSchema(client: PoolClient): Promise<void> {
  // Dynamically migrate table constraint to support multiple course types per course code
  await client.query(`
    ALTER TABLE curriculum_courses 
    DROP CONSTRAINT IF EXISTS curriculum_courses_program_id_course_code_key
  `);

  const constraintCheck = await client.query(`
    SELECT 1 FROM pg_constraint WHERE conname = 'curriculum_courses_program_id_course_code_course_type_key'
  `);
  if (constraintCheck.rowCount === 0) {
    try {
      await client.query(`
        ALTER TABLE curriculum_courses 
        ADD CONSTRAINT curriculum_courses_program_id_course_code_course_type_key 
        UNIQUE (program_id, course_code, course_type)
      `);
    } catch {
      // Ignore if constraint already exists
    }
  }

  // Upgrade database schema dynamically to add Knowledge Block column and table
  await client.query(`
    ALTER TABLE curriculum_courses ADD COLUMN IF NOT EXISTS knowledge_block VARCHAR(50) DEFAULT 'GENERAL'
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS knowledge_block_mappings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        knowledge_block VARCHAR(50) NOT NULL UNIQUE,
        label VARCHAR(100) NOT NULL,
        phrases TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.query(`
    INSERT INTO knowledge_block_mappings (knowledge_block, label, phrases) VALUES
    ('GENERAL',     'Đại cương',            ARRAY['đại cương','chính trị','mác-lênin','ngoại ngữ','tiếng anh','thể chất','quốc phòng','pháp luật','kỹ năng']),
    ('SECTOR_CORE',  'Cơ sở khối ngành',     ARRAY['cơ sở khối ngành','cơ sở nhóm ngành','khối ngành']),
    ('MAJOR_CORE',   'Cơ sở ngành',          ARRAY['cơ sở ngành','nền tảng','cơ bản','toán','lập trình','cấu trúc dữ liệu']),
    ('SPECIALIZED',  'Chuyên ngành',         ARRAY['chuyên ngành','chuyên sâu','tốt nghiệp','thực tập','đồ án','chuyên đề'])
    ON CONFLICT (knowledge_block) DO NOTHING
  `);
}

export interface ParseOptions {
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  } | null;
  textContent?: string | null;
  sheetIndex?: number;
}

export async function parseCurriculumWithPipeline(
  queryExecutor: Pool | PoolClient,
  courseTypeMappingConfig: any,
  options: ParseOptions,
): Promise<{
  preview: ParsedCourseItem[];
  warnings: ParseWarningItem[];
  sheets: string[];
  activeSheetIndex: number;
}> {
  // Fetch active column mappings from database
  const mappingResult = await queryExecutor.query<{
    field_key: string;
    phrases: string[];
  }>('SELECT field_key, phrases FROM curriculum_column_mappings');
  const mappingConfig: Record<string, string[]> = {};
  mappingResult.rows.forEach((row) => {
    mappingConfig[row.field_key] = row.phrases;
  });

  const pipelineUrl =
    process.env.PIPELINE_SERVER_URL || 'http://localhost:5101';
  const formData = new FormData();
  formData.append('columnMappings', JSON.stringify(mappingConfig));
  formData.append(
    'courseTypeMappings',
    JSON.stringify(courseTypeMappingConfig),
  );

  if (options.file) {
    const blob = new Blob([new Uint8Array(options.file.buffer)], {
      type: options.file.mimetype,
    });
    formData.append('file', blob, options.file.originalname);
  } else if (options.textContent) {
    formData.append('textContent', options.textContent);
  }

  if (options.sheetIndex !== undefined) {
    formData.append('sheetIndex', String(options.sheetIndex));
  }

  const response = await fetch(`${pipelineUrl}/parse/curriculum`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Pipeline error: ${response.statusText}`);
  }

  const parsedData = (await response.json()) as {
    preview?: any[];
    warnings?: any[];
    sheets?: string[];
    activeSheetIndex?: number;
  };

  // Fetch knowledge block mappings for preview auto-resolution
  const kbMappingsResult = await queryExecutor.query<KbMappingRow>(
    'SELECT knowledge_block, label, phrases FROM knowledge_block_mappings',
  );
  const kbMappings = kbMappingsResult.rows;

  const finalPreview = (parsedData.preview ?? []).map((c) => {
    const course = c as ParsedCourseItem;
    const resolved = resolveKB(
      course.knowledgeBlock || course.courseGroup || null,
      kbMappings,
      course.courseName || null,
    );
    return {
      ...course,
      knowledgeBlock: resolved,
      knowledge_block: resolved,
    };
  });

  return {
    preview: finalPreview,
    warnings: (parsedData.warnings ?? []) as ParseWarningItem[],
    sheets: parsedData.sheets ?? [],
    activeSheetIndex: parsedData.activeSheetIndex ?? 0,
  };
}

export async function saveParseWarnings(
  queryExecutor: Pool | PoolClient,
  sourceId: string,
  warnings: ParseWarningItem[],
  clearOld = false,
): Promise<void> {
  if (clearOld) {
    await queryExecutor.query(
      `DELETE FROM parse_warnings WHERE source_type = 'CURRICULUM' AND source_id = $1`,
      [sourceId],
    );
  }

  if (warnings && warnings.length > 0) {
    for (const warning of warnings) {
      await queryExecutor.query(
        `INSERT INTO parse_warnings (source_type, source_id, row_number, warning_code, warning_message, raw_value)
         VALUES ('CURRICULUM', $1, $2, $3, $4, $5)`,
        [
          sourceId,
          warning.rowNumber || null,
          warning.code || 'UNKNOWN',
          warning.message || '',
          warning.rawValue || '',
        ],
      );
    }
  }
}

export async function insertCurriculumCourses(
  client: PoolClient,
  programId: string | null,
  importId: string,
  courses: ParsedCourseItem[],
): Promise<void> {
  // Fetch knowledge block mappings from database for auto-resolution
  const kbMappingsResult = await client.query<KbMappingRow>(
    'SELECT knowledge_block, label, phrases FROM knowledge_block_mappings',
  );
  const kbMappings = kbMappingsResult.rows;

  for (const course of courses) {
    const kbResolved =
      course.knowledgeBlock ||
      course.knowledge_block ||
      resolveKB(
        course.courseGroup || null,
        kbMappings,
        course.courseName || course.course_name || null,
      );

    await client.query(
      `INSERT INTO curriculum_courses (
         program_id, import_id, course_code, course_name, credits, expected_semester, course_group, course_type, knowledge_block, is_required,
         theory_hours, practice_hours, project_hours, internship_hours, prerequisite, corequisite, organizing_semester
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (program_id, course_code, course_type) 
       DO UPDATE SET 
         course_name = EXCLUDED.course_name,
         credits = EXCLUDED.credits,
         expected_semester = EXCLUDED.expected_semester,
         course_group = EXCLUDED.course_group,
         knowledge_block = EXCLUDED.knowledge_block,
         is_required = EXCLUDED.is_required,
         theory_hours = EXCLUDED.theory_hours,
         practice_hours = EXCLUDED.practice_hours,
         project_hours = EXCLUDED.project_hours,
         internship_hours = EXCLUDED.internship_hours,
         prerequisite = EXCLUDED.prerequisite,
         corequisite = EXCLUDED.corequisite,
         organizing_semester = EXCLUDED.organizing_semester,
         updated_at = CURRENT_TIMESTAMP`,
      [
        programId,
        importId,
        course.courseCode || course.course_code,
        course.courseName || course.course_name,
        course.credits ?? null,
        course.expectedSemester || course.expected_semester || null,
        course.courseGroup || course.course_group || null,
        course.courseType || course.course_type || 'REQUIRED',
        kbResolved,
        course.isRequired !== undefined ? course.isRequired : true,
        course.theoryHours != null
          ? Number(course.theoryHours)
          : course.theory_hours != null
            ? Number(course.theory_hours)
            : null,
        course.practiceHours != null
          ? Number(course.practiceHours)
          : course.practice_hours != null
            ? Number(course.practice_hours)
            : null,
        course.projectHours != null
          ? Number(course.projectHours)
          : course.project_hours != null
            ? Number(course.project_hours)
            : null,
        course.internshipHours != null
          ? Number(course.internshipHours)
          : course.internship_hours != null
            ? Number(course.internship_hours)
            : null,
        course.prerequisite || null,
        course.corequisite || null,
        course.organizingSemester || course.organizing_semester || null,
      ],
    );
  }
}
