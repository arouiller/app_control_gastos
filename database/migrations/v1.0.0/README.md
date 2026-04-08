# v1.0.0 - Schema Inicial

**Fecha**: 2026-04-08  
**Tiempo estimado**: < 1 minuto  
**Breaking changes**: No  

## Cambios

Crea el schema completo inicial de la aplicación:

- Tablas: `users`, `categories`, `expenses`, `installments`, `sessions`, `audit_logs`
- Índices de optimización adicionales
- Vistas: `v_monthly_summary`, `v_spending_by_category`, `v_pending_installments`, `v_cash_vs_card`
- Triggers: `trg_installment_after_insert`, `trg_installment_after_update`
- Tablas de versionado: `schema_version`, `schema_version_history`

## Archivos UP (orden de ejecución)

1. `001_create_users.sql`
2. `002_create_categories.sql`
3. `003_create_expenses.sql`
4. `004_create_installments.sql`
5. `005_create_sessions.sql`
6. `006_create_audit_logs.sql`
7. `007_create_indexes.sql`
8. `008_create_views.sql`
9. `009_create_trigger_insert.sql`
10. `010_create_trigger_update.sql`

## Archivos DOWN (orden de ejecución)

1. `001_drop_triggers.sql`
2. `002_drop_views.sql`
3. `003_drop_tables.sql`

## Notas

- Todos los CREATE TABLE usan IF NOT EXISTS → idempotente
- Las vistas usan CREATE OR REPLACE VIEW → idempotente
- Los triggers usan DROP IF EXISTS antes de CREATE → idempotente
- Los índices usan CREATE INDEX IF NOT EXISTS → idempotente
