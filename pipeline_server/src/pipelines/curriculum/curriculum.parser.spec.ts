import { CurriculumParser } from './curriculum.parser';

describe('CurriculumParser', () => {
  let parser: CurriculumParser;

  beforeEach(() => {
    parser = new CurriculumParser();
  });

  it('should parse text and map rows correctly', () => {
    const csvText = `71LAWG10012,Pháp luật đại cương,2,1,ĐẠI CƯƠNG,REQUIRED\n71ENVH10012,Môi trường và con người,2,1,ĐẠI CƯƠNG,REQUIRED`;
    const rows = parser.parseText(csvText);
    expect(rows).toHaveLength(2);
    expect(rows[0].values).toEqual([
      '71LAWG10012',
      'Pháp luật đại cương',
      '2',
      '1',
      'ĐẠI CƯƠNG',
      'REQUIRED',
    ]);

    const result = parser.mapRows(rows);
    expect(result.courses).toHaveLength(2);
    expect(result.courses[0].courseCode).toBe('71LAWG10012');
    expect(result.courses[0].courseName).toBe('Pháp luật đại cương');
    expect(result.courses[0].credits).toBe(2);
    expect(result.courses[0].expectedSemester).toBe(1);
    expect(result.courses[0].courseGroup).toBe('ĐẠI CƯƠNG');
    expect(result.courses[0].isRequired).toBe(true);
  });
});
