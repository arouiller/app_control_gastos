import { useEffect, useState } from 'react'
import { FiArrowDown, FiArrowUp, FiCheckCircle, FiDatabase, FiShield } from 'react-icons/fi'
import { adminService } from '../services/adminService'
import Card, { CardTitle } from '../components/UI/Card'
import { PageLoader } from '../components/UI/LoadingSpinner'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import Modal from '../components/UI/Modal'

function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

export default function Admin() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [versions, setVersions] = useState(null)
  const [currentVersion, setCurrentVersion] = useState(null)
  const [versionsError, setVersionsError] = useState(null)

  const [confirm, setConfirm] = useState(null) // { version, direction, description }
  const [migrating, setMigrating] = useState(false)
  const [migrateResult, setMigrateResult] = useState(null) // { ok, message }

  useEffect(() => {
    adminService.getDbInfo()
      .then(setData)
      .catch(() => setError('No se pudo cargar la información de la base de datos.'))
      .finally(() => setLoading(false))

    adminService.getDbVersions()
      .then(({ current, versions: v }) => {
        setCurrentVersion(current)
        setVersions(v)
      })
      .catch(() => setVersionsError('No se pudo cargar el listado de versiones.'))
  }, [])

  const handleVersionClick = (v) => {
    const direction = compareVersions(v.version, currentVersion) > 0 ? 'up' : 'down'
    setConfirm({ version: v.version, direction, description: v.description })
    setMigrateResult(null)
  }

  const handleConfirmMigrate = async () => {
    setMigrating(true)
    try {
      await adminService.migrateToVersion(confirm.version)
      setCurrentVersion(confirm.version)
      setMigrateResult({ ok: true, message: `Migración a v${confirm.version} completada.` })
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error durante la migración.'
      setMigrateResult({ ok: false, message: msg })
    } finally {
      setMigrating(false)
      setConfirm(null)
    }
  }

  if (loading) return <PageLoader />

  if (error) return (
    <div className="flex items-center justify-center h-40 text-danger text-sm">{error}</div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FiShield size={22} className="text-secondary" />
        <h1 className="text-xl font-bold text-primary">Panel de Administrador</h1>
      </div>

      {/* Versión de BD */}
      <Card>
        <CardTitle className="flex items-center gap-2 mb-4">
          <FiDatabase size={16} />
          Base de Datos
        </CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-darker">Versión actual:</span>
          <span className="font-mono text-sm font-semibold bg-neutral px-3 py-1 rounded-full text-secondary">
            v{data.version}
          </span>
        </div>
      </Card>

      {/* Versiones disponibles */}
      <Card>
        <CardTitle className="flex items-center gap-2 mb-4">
          <FiDatabase size={16} />
          Versiones disponibles
        </CardTitle>

        {migrateResult && (
          <div className={`mb-4 px-4 py-3 rounded-md text-sm font-medium ${migrateResult.ok ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
            {migrateResult.message}
          </div>
        )}

        {versionsError ? (
          <p className="text-sm text-danger">{versionsError}</p>
        ) : !versions ? (
          <p className="text-sm text-neutral-darker">Cargando...</p>
        ) : (
          <div className="space-y-2">
            {[...versions].sort((a, b) => compareVersions(b.version, a.version)).map((v) => {
              const isCurrent = v.version === currentVersion
              const direction = currentVersion
                ? compareVersions(v.version, currentVersion) > 0 ? 'up' : 'down'
                : null

              return (
                <div
                  key={v.version}
                  onClick={() => !isCurrent && handleVersionClick(v)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-colors
                    ${isCurrent
                      ? 'border-secondary/40 bg-secondary/5 cursor-default'
                      : 'border-neutral hover:border-secondary/50 hover:bg-neutral/50 cursor-pointer'
                    }`}
                >
                  {/* Icono de dirección */}
                  <div className="mt-0.5 shrink-0">
                    {isCurrent
                      ? <FiCheckCircle size={16} className="text-secondary" />
                      : direction === 'up'
                        ? <FiArrowUp size={16} className="text-success-text" />
                        : <FiArrowDown size={16} className="text-warning-text" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-primary">v{v.version}</span>
                      {isCurrent && <Badge variant="info">actual</Badge>}
                      {v.breaking && <Badge variant="danger">breaking</Badge>}
                      <span className="text-xs text-neutral-darker">{v.releaseDate}</span>
                    </div>
                    <p className="text-sm text-neutral-darker mt-0.5">{v.description}</p>
                    {v.notes && <p className="text-xs text-neutral-darker/70 mt-0.5">{v.notes}</p>}
                  </div>

                  {/* Tiempo estimado */}
                  <span className="shrink-0 text-xs text-neutral-darker">{v.estimatedTime}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Tablas */}
      <Card>
        <CardTitle className="mb-4">Tablas</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral">
                <th className="text-left py-2 px-3 font-medium text-neutral-darker">Tabla</th>
                <th className="text-right py-2 px-3 font-medium text-neutral-darker">Registros</th>
              </tr>
            </thead>
            <tbody>
              {data.tables.map(({ table, count }) => (
                <tr key={table} className="border-b border-neutral last:border-0 hover:bg-neutral/50">
                  <td className="py-2.5 px-3 font-mono text-primary">{table}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-secondary">
                    {count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral">
                <td className="py-2 px-3 text-xs text-neutral-darker font-medium">Total</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-primary">
                  {data.tables.reduce((s, r) => s + r.count, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Modal confirmación migración */}
      <Modal
        isOpen={!!confirm}
        onClose={() => !migrating && setConfirm(null)}
        title="Confirmar migración"
        maxWidth="max-w-md"
      >
        {confirm && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-darker">
              Se aplicará la migración{' '}
              <span className="font-semibold text-primary">
                {confirm.direction === 'up' ? 'UP' : 'DOWN'}
              </span>{' '}
              hacia la versión{' '}
              <span className="font-mono font-semibold text-secondary">v{confirm.version}</span>.
            </p>
            <p className="text-sm text-neutral-darker">{confirm.description}</p>
            {confirm.direction === 'down' && (
              <div className="px-3 py-2 bg-warning-bg text-warning-text text-xs rounded-md">
                Esta operación revierte cambios en la base de datos. Asegurate de tener un backup.
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirm(null)}
                disabled={migrating}
              >
                Cancelar
              </Button>
              <Button
                variant={confirm.direction === 'down' ? 'danger' : 'primary'}
                size="sm"
                loading={migrating}
                onClick={handleConfirmMigrate}
              >
                Confirmar {confirm.direction === 'up' ? 'upgrade' : 'downgrade'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
