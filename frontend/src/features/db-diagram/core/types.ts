export interface ColumnDef {
  name: string;
  type: string;
  isPK: boolean;
  isFK: boolean;
  nullable: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableDef {
  id?: string;
  name: string;
  columns: ColumnDef[];
}

export interface RelationshipDef {
  id: string;
  sourceTable: string;
  sourceField: string;
  targetTable: string;
  targetField: string;
}
