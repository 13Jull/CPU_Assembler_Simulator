import type { FC } from 'react'
import { useState } from 'react'

import { useSelector } from '@/app/store'
import CardHeader from '@/common/components/CardHeader'
import { ArrowDown, ArrowUp } from '@/common/components/icons'
import { useToggle } from '@/common/hooks'
import { classNames, decToHex, invariant, range } from '@/common/utils'
import { MAX_SP } from '@/features/cpu/core'
import { selectCpuPointerRegisters } from '@/features/cpu/cpuSlice'

import {
  MemoryView,
  selectMemoryDataRows,
  selectMemoryView,
} from './memorySlice'
import { selectMemorySourceRows } from './selectors'

// 👇 hook that gives us the Redux-based controller
import { useController } from '@/features/controller/hooks'
console.log('[Memory.tsx] controller instance id:', (useController as any).__id)

const Memory: FC = () => {
  const [isOpen, toggleOpen] = useToggle(true)
  const Icon = isOpen ? ArrowUp : ArrowDown

  const controller = useController()
  console.log('[Memory.tsx] controller instance:', controller)
  console.log('[Memory.tsx] has injectRandomAt:', typeof controller.injectRandomAt)

  // local UI state for the address + feedback
  const [addr, setAddr] = useState(0)
  const [msg, setMsg] = useState('')

  const memoryView = useSelector(selectMemoryView)
  const isDataView = memoryView !== MemoryView.Source

  const getDataRows = useSelector(selectMemoryDataRows)
  const getSourceRows = useSelector(selectMemorySourceRows)

  const rows = isDataView ? getDataRows() : getSourceRows()

  const { ip, sp } = useSelector(selectCpuPointerRegisters)

  const handleInject = () => {
    const n = Number(addr)
    // memory size is 0x100 in your core
    if (Number.isNaN(n) || n < 0 || n > 0xff) {
      setMsg('Address must be between 0 and 255')
      return
    }
    controller.injectRandomAt(n)
    setMsg(`Injected random data at ${n}`)
  }

  return (
    <div className={classNames({ 'border-b': isOpen })}>
      <CardHeader title="Memory" onClick={toggleOpen}>
        <span className="w-4">
          <Icon className="mx-auto fill-gray-400" width="0.625rem" />
        </span>
      </CardHeader>

      {isOpen && (
        <>
          {/* controls to inject random data */}
          <div className="px-3 py-2 flex items-center gap-2 text-sm">
            <label className="flex items-center gap-1">
              Addr
              <input
                type="number"
                min={0}
                max={255}
                value={addr}
                onChange={(e) => setAddr(Number(e.target.value))}
                className="border rounded px-1 w-20"
              />
            </label>
            <button
              onClick={handleInject}
              className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
            >
              Inject random data
            </button>
            {msg && <span className="text-gray-400">{msg}</span>}
          </div>

          <table className="text-sm w-full">
            <tbody className="divide-y">
              <tr className="divide-x bg-gray-50 text-gray-400">
                <td />
                {range(0x10).map((colIndex) => (
                  <td key={colIndex} className="text-center">
                    <span className="px-1">
                      {decToHex(colIndex)[1] /* ignore padded 0 */}
                    </span>
                  </td>
                ))}
              </tr>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="divide-x">
                  <td className="bg-gray-50 text-center text-gray-400">
                    <span className="px-1">
                      {decToHex(rowIndex)[1] /* ignore padded 0 */}
                    </span>
                  </td>
                  {row.map((value, colIndex) => {
                    const address = rowIndex * 0x10 + colIndex
                    return (
                      <td key={colIndex} className="text-center">
                        <span
                          className={classNames(
                            'inline-block w-full rounded',
                            { 'bg-green-100': address === ip },
                            isDataView && {
                              'bg-blue-100': address === sp,
                              'bg-blue-50':
                                address > sp && address <= MAX_SP,
                            },
                          )}
                        >
                          {memoryView === MemoryView.Hexadecimal
                            ? (invariant(typeof value === 'number'),
                              decToHex(value))
                            : value}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

export default Memory