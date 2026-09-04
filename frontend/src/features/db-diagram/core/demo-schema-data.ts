export interface DemoField {
  name: string;
  type: string;
  isPK: boolean;
  nullable: boolean;
}

export interface DemoTable {
  id: string;
  name: string;
  fields: DemoField[];
  color: string;
  position: { x: number; y: number };
  parentId?: string;
}

export interface DemoArea {
  id: string;
  label: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface DemoRelationship {
  id: string;
  sourceTable: string;
  sourceField: string;
  targetTable: string;
  targetField: string;
  sourceCardinality: 'one' | 'many';
  targetCardinality: 'one' | 'many';
}

export const demoAreas: DemoArea[] = [
  {
    id: 'area-employee',
    label: 'Employee Info',
    color: 'rgb(142, 183, 255)',
    position: { x: -333.459, y: -181.995 },
    size: { width: 708, height: 619 },
  },
  {
    id: 'area-status',
    label: 'Current Status',
    color: 'rgb(192, 93, 207)',
    position: { x: -307.51, y: 479.991 },
    size: { width: 778, height: 252 },
  },
];

export const demoTables: DemoTable[] = [
  {
    id: 'tbl-employees',
    name: 'employees',
    color: 'rgb(59, 130, 246)',
    position: { x: 30, y: 50 },
    fields: [
      { name: 'id', type: 'int', isPK: true, nullable: false },
      { name: 'emp_no', type: 'int', isPK: true, nullable: false },
      { name: 'birth_date', type: 'date', isPK: false, nullable: false },
      { name: 'first_name', type: 'varchar(14)', isPK: false, nullable: false },
      { name: 'last_name', type: 'varchar(16)', isPK: false, nullable: false },
      { name: 'gender', type: 'char(1)', isPK: false, nullable: false },
      { name: 'hire_date', type: 'date', isPK: false, nullable: false },
    ],
    parentId: 'area-employee',
  },
  {
    id: 'tbl-salaries',
    name: 'salaries',
    color: 'rgb(77, 238, 138)',
    position: { x: 330, y: 50 },
    fields: [
      { name: 'emp_no', type: 'int', isPK: true, nullable: false },
      { name: 'salary', type: 'int', isPK: false, nullable: false },
      { name: 'from_date', type: 'date', isPK: true, nullable: false },
      { name: 'to_date', type: 'date', isPK: false, nullable: true },
      { name: 'price', type: 'decimal(10,2)', isPK: false, nullable: true },
    ],
    parentId: 'area-employee',
  },
  {
    id: 'tbl-titles',
    name: 'titles',
    color: 'rgb(77, 238, 138)',
    position: { x: 30, y: 50 },
    fields: [
      { name: 'emp_no', type: 'int', isPK: true, nullable: false },
      { name: 'title', type: 'varchar(50)', isPK: true, nullable: false },
      { name: 'from_date', type: 'date', isPK: true, nullable: false },
      { name: 'to_date', type: 'date', isPK: false, nullable: true },
    ],
    parentId: 'area-status',
  },
  {
    id: 'tbl-dept_emp',
    name: 'dept_emp',
    color: 'rgb(77, 238, 138)',
    position: { x: 330, y: 50 },
    fields: [
      { name: 'emp_no', type: 'int', isPK: true, nullable: false },
      { name: 'dept_no', type: 'char(4)', isPK: true, nullable: false },
      { name: 'from_date', type: 'date', isPK: false, nullable: false },
      { name: 'to_date', type: 'date', isPK: false, nullable: true },
    ],
    parentId: 'area-status',
  },
  {
    id: 'tbl-departments',
    name: 'departments',
    color: 'rgb(250, 204, 21)',
    position: { x: 60, y: 100 },
    fields: [
      { name: 'dept_no', type: 'char(4)', isPK: true, nullable: false },
      { name: 'dept_name', type: 'varchar(40)', isPK: false, nullable: false },
    ],
  },
];

export const demoRelationships: DemoRelationship[] = [
  {
    id: 'rel-salaries-employees',
    sourceTable: 'tbl-salaries',
    sourceField: 'emp_no',
    targetTable: 'tbl-employees',
    targetField: 'emp_no',
    sourceCardinality: 'many',
    targetCardinality: 'one',
  },
  {
    id: 'rel-titles-employees',
    sourceTable: 'tbl-titles',
    sourceField: 'emp_no',
    targetTable: 'tbl-employees',
    targetField: 'emp_no',
    sourceCardinality: 'many',
    targetCardinality: 'one',
  },
  {
    id: 'rel-dept_emp-employees',
    sourceTable: 'tbl-dept_emp',
    sourceField: 'emp_no',
    targetTable: 'tbl-employees',
    targetField: 'emp_no',
    sourceCardinality: 'many',
    targetCardinality: 'one',
  },
  {
    id: 'rel-dept_emp-departments',
    sourceTable: 'tbl-dept_emp',
    sourceField: 'dept_no',
    targetTable: 'tbl-departments',
    targetField: 'dept_no',
    sourceCardinality: 'many',
    targetCardinality: 'one',
  },
];
