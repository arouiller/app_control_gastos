import { useEffect, useState } from 'react'
import { FiDatabase, FiShield } from 'react-icons/fi'
import { adminService } from '../services/adminService'
import Card, { CardTitle } from '../components/UI/Card'
import { PageLoader } from '../components/UI/LoadingSpinner'

export default function Admin() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    adminService.getDbInfo()
      .then(setData)
      .catch(() => setError('No se pudo cargar la información de la base de datos.'))
      .finally(() => setLoading(false))
  }, [])

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
    </div>
  )
}
