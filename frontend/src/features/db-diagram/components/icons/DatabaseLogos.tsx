import React from 'react';
import { DiPostgresql, DiMysql, DiSqllite, DiMsqlServer } from 'react-icons/di';
import { SiMariadb, SiClickhouse, SiJson } from 'react-icons/si';
import { GrOracle } from 'react-icons/gr';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * PostgreSQL Logo from Devicon (react-icons/di)
 */
export const PostgresLogo: React.FC<LogoProps> = ({ className = 'w-12 h-12 text-[#336791]', size = 48 }) => (
  <DiPostgresql className={className} size={size} />
);

/**
 * MySQL Logo from Devicon (react-icons/di)
 */
export const MySqlLogo: React.FC<LogoProps> = ({ className = 'w-12 h-12 text-[#00758F]', size = 48 }) => (
  <DiMysql className={className} size={size} />
);

/**
 * MariaDB Logo from Simple Icons (react-icons/si)
 */
export const MariaDbLogo: React.FC<LogoProps> = ({ className = 'w-12 h-12 text-[#C0765A]', size = 44 }) => (
  <SiMariadb className={className} size={size} />
);

/**
 * SQLite Logo from Devicon (react-icons/di)
 */
export const SqliteLogo: React.FC<LogoProps> = ({ className = 'w-12 h-12 text-[#2878BA]', size = 48 }) => (
  <DiSqllite className={className} size={size} />
);

/**
 * Microsoft SQL Server Logo from Devicon (react-icons/di)
 */
export const SqlServerLogo: React.FC<LogoProps> = ({ className = 'w-12 h-12 text-[#CC292B]', size = 48 }) => (
  <DiMsqlServer className={className} size={size} />
);

/**
 * Oracle DB Logo from Grommet Icons (react-icons/gr)
 */
export const OracleLogo: React.FC<LogoProps> = ({ className = 'w-12 h-12 text-[#F80000]', size = 44 }) => (
  <GrOracle className={className} size={size} />
);

/**
 * ClickHouse Logo from Simple Icons (react-icons/si)
 */
export const ClickhouseLogo: React.FC<LogoProps> = ({ className = 'w-12 h-12 text-[#F9D548]', size = 44 }) => (
  <SiClickhouse className={className} size={size} />
);

/**
 * JSON Schema Logo from Simple Icons (react-icons/si)
 */
export const JsonLogo: React.FC<LogoProps> = ({ className = 'w-12 h-12 text-[#AA73FF]', size = 44 }) => (
  <SiJson className={className} size={size} />
);
