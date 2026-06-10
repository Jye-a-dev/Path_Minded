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
  headersDetected?: boolean;
  rawHeaders?: string[];
  potentialHeaderRow?: number;
}> {
  // Fetch active column mappings from database
  const mappingResult = await queryExecutor.query<{
    field_key: string;
    phrases: string[];
  }>(
    "SELECT field_key, phrases FROM curriculum_column_mappings WHERE mapping_type = 'CURRICULUM'",
  );
  const mappingConfig: Record<string, string[]> = {};
  mappingResult.rows.forEach((row) => {
    mappingConfig[row.field_key] = row.phrases;
  });

  const pipelineUrl =
    process.env.PIPELINE_SERVER_URL || 'http://localhost:3100';
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
    headersDetected?: boolean;
    rawHeaders?: string[];
    potentialHeaderRow?: number;
  };

  // If headers were not detected, return immediately without KB resolution
  if (parsedData.headersDetected === false) {
    return {
      preview: [],
      warnings: [],
      sheets: parsedData.sheets ?? [],
      activeSheetIndex: parsedData.activeSheetIndex ?? 0,
      headersDetected: false,
      rawHeaders: parsedData.rawHeaders ?? [],
      potentialHeaderRow: parsedData.potentialHeaderRow,
    };
  }

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
    const sourceIds: string[] = [];
    const rowNumbers: Array<number | null> = [];
    const warningCodes: string[] = [];
    const warningMessages: string[] = [];
    const rawValues: string[] = [];

    for (const warning of warnings) {
      sourceIds.push(sourceId);
      rowNumbers.push(warning.rowNumber ?? null);
      warningCodes.push(warning.code || 'UNKNOWN');
      warningMessages.push(warning.message || '');
      rawValues.push(warning.rawValue || '');
    }

    await queryExecutor.query(
      `INSERT INTO parse_warnings (source_type, source_id, row_number, warning_code, warning_message, raw_value)
       SELECT 'CURRICULUM', UNNEST($1::uuid[]), UNNEST($2::int[]), UNNEST($3::text[]), UNNEST($4::text[]), UNNEST($5::text[])`,
      [sourceIds, rowNumbers, warningCodes, warningMessages, rawValues],
    );
  }
}

export function parsePrerequisites(prereqStr: string | null): string[] {
  if (!prereqStr) return [];
  const str = prereqStr.trim().toUpperCase();
  if (['KHÔNG', 'NONE', '-', 'N/A', '', 'KHÔNG CÓ'].includes(str)) return [];

  // Match typical course code format, e.g. "INT1008", "INT 1008", "PHY1100", "MAT-101", "71ENG010012", etc.
  const regex = /\b\d*[A-Z]{2,6}\s*-?\s*\d{3,8}\b/g;
  const matches = str.match(regex);
  if (matches) {
    return matches.map((m) => m.replace(/\s+/g, '').replace(/-/g, ''));
  }

  // Fallback: split by commas/semicolons and clean up
  return str
    .split(/[,;&+/\n]|\bVÀ\b/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 5 && token.length <= 15)
    .map((token) => token.replace(/[^A-Z0-9]/g, ''));
}

export async function insertCurriculumCourses(
  client: PoolClient,
  programId: string | null,
  importId: string,
  courses: ParsedCourseItem[],
): Promise<void> {
  // Clear old prerequisites for this program first to avoid duplicates
  if (programId) {
    await client.query(
      `DELETE FROM course_prerequisites WHERE program_id = $1`,
      [programId],
    );
  }

  // Fetch knowledge block mappings from database for auto-resolution
  const kbMappingsResult = await client.query<KbMappingRow>(
    'SELECT knowledge_block, label, phrases FROM knowledge_block_mappings',
  );
  const kbMappings = kbMappingsResult.rows;

  if (courses.length === 0) return;

  const programIds: Array<string | null> = [];
  const importIds: string[] = [];
  const courseCodes: string[] = [];
  const courseNames: string[] = [];
  const creditsList: Array<number | null> = [];
  const expectedSemesters: Array<number | null> = [];
  const courseGroups: Array<string | null> = [];
  const courseTypes: string[] = [];
  const kbResolvedList: string[] = [];
  const isRequiredList: boolean[] = [];
  const theoryHoursList: Array<number | null> = [];
  const practiceHoursList: Array<number | null> = [];
  const projectHoursList: Array<number | null> = [];
  const internshipHoursList: Array<number | null> = [];
  const prerequisitesList: Array<string | null> = [];
  const corequisitesList: Array<string | null> = [];
  const organizingSemestersList: Array<string | null> = [];

  // For batching prerequisites
  const prereqProgramIds: string[] = [];
  const prereqCourseCodes: string[] = [];
  const prereqCodes: string[] = [];

  for (const course of courses) {
    const kbResolved =
      course.knowledgeBlock ||
      course.knowledge_block ||
      resolveKB(
        course.courseGroup || null,
        kbMappings,
        course.courseName || course.course_name || null,
      );

    const courseCode = course.courseCode || course.course_code;
    if (!courseCode) continue;

    programIds.push(programId);
    importIds.push(importId);
    courseCodes.push(courseCode);
    courseNames.push((course.courseName || course.course_name || '').trim());
    creditsList.push(course.credits ?? null);
    expectedSemesters.push(
      course.expectedSemester || course.expected_semester || null,
    );
    courseGroups.push(course.courseGroup || course.course_group || null);
    courseTypes.push(course.courseType || course.course_type || 'REQUIRED');
    kbResolvedList.push(kbResolved);
    isRequiredList.push(course.isRequired !== false);

    theoryHoursList.push(
      course.theoryHours != null
        ? Number(course.theoryHours)
        : course.theory_hours != null
          ? Number(course.theory_hours)
          : null,
    );
    practiceHoursList.push(
      course.practiceHours != null
        ? Number(course.practiceHours)
        : course.practice_hours != null
          ? Number(course.practice_hours)
          : null,
    );
    projectHoursList.push(
      course.projectHours != null
        ? Number(course.projectHours)
        : course.project_hours != null
          ? Number(course.project_hours)
          : null,
    );
    internshipHoursList.push(
      course.internshipHours != null
        ? Number(course.internshipHours)
        : course.internship_hours != null
          ? Number(course.internship_hours)
          : null,
    );
    prerequisitesList.push(course.prerequisite || null);
    corequisitesList.push(course.corequisite || null);
    organizingSemestersList.push(
      course.organizingSemester || course.organizing_semester || null,
    );

    const prereqStr = course.prerequisite || null;
    if (programId && prereqStr) {
      const prereqs = parsePrerequisites(prereqStr);
      for (const prereqCode of prereqs) {
        if (prereqCode === courseCode) continue;
        prereqProgramIds.push(programId);
        prereqCourseCodes.push(courseCode);
        prereqCodes.push(prereqCode);
      }
    }
  }

  if (courseCodes.length > 0) {
    await client.query(
      `INSERT INTO curriculum_courses (
         program_id, import_id, course_code, course_name, credits, expected_semester, course_group, course_type, knowledge_block, is_required,
         theory_hours, practice_hours, project_hours, internship_hours, prerequisite, corequisite, organizing_semester
       )
       SELECT 
         UNNEST($1::uuid[]), UNNEST($2::uuid[]), UNNEST($3::text[]), UNNEST($4::text[]), UNNEST($5::int[]), UNNEST($6::int[]), 
         UNNEST($7::text[]), UNNEST($8::text[])::course_type, UNNEST($9::text[]), UNNEST($10::boolean[]), UNNEST($11::int[]), UNNEST($12::int[]), 
         UNNEST($13::int[]), UNNEST($14::int[]), UNNEST($15::text[]), UNNEST($16::text[]), UNNEST($17::text[])
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
        programIds,
        importIds,
        courseCodes,
        courseNames,
        creditsList,
        expectedSemesters,
        courseGroups,
        courseTypes,
        kbResolvedList,
        isRequiredList,
        theoryHoursList,
        practiceHoursList,
        projectHoursList,
        internshipHoursList,
        prerequisitesList,
        corequisitesList,
        organizingSemestersList,
      ],
    );
  }

  if (prereqProgramIds.length > 0) {
    await client.query(
      `INSERT INTO course_prerequisites (program_id, course_code, prerequisite_course_code, prerequisite_type)
       SELECT UNNEST($1::uuid[]), UNNEST($2::text[]), UNNEST($3::text[]), 'REQUIRED'
       ON CONFLICT (program_id, course_code, prerequisite_course_code) 
       DO NOTHING`,
      [prereqProgramIds, prereqCourseCodes, prereqCodes],
    );
  }
}
