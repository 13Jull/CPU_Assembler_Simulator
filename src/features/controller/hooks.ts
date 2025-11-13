// src/features/controller/hooks.ts
import { useEffect } from 'react'
import { debounceTime, delayWhen, filter, merge, of, timer } from 'rxjs'

import { store } from '@/app/store'
import { UPDATE_TIMEOUT_MS } from '@/common/constants'
import { observe } from '@/common/observe'
import { setAssemblerError, setAssemblerState } from '@/features/assembler/assemblerSlice'
import { setEditorInput } from '@/features/editor/editorSlice'

import {
  selectAutoAssemble,
  selectIsRunning,
  selectIsSuspended,
  selectRuntimeConfiguration,
} from './controllerSlice'
import { Controller } from './core'

const controller = new Controller()

export const useController = (): Controller => {
  // use the single shared controller instance created at module load
  useEffect(() => {
    const autoAssemble$ = store.onState(selectAutoAssemble)
    return observe(
      autoAssemble$.pipe(debounceTime(UPDATE_TIMEOUT_MS), filter(Boolean)),
      controller.assemble,
    )
  }, [])

  useEffect(() => {
    const setEditorInput$ = store.onAction(setEditorInput)
    return observe(
      setEditorInput$.pipe(
        // you can keep your original tap/resetSelf if present
        filter(() => store.getState(selectAutoAssemble)),
        delayWhen(({ isFromFile }) => (isFromFile ? timer(UPDATE_TIMEOUT_MS) : of(null))),
      ),
      controller.assemble,
    )
  }, [])

  useEffect(() => {
    const setAssemblerState$ = store.onAction(setAssemblerState)
    const setAssemblerError$ = store.onAction(setAssemblerError)
    return observe(merge(setAssemblerState$, setAssemblerError$), controller.reset)
  }, [])

  useEffect(() => {
    const runtimeConfiguration$ = store.onState(selectRuntimeConfiguration)
    return observe(
      runtimeConfiguration$.pipe(
        filter(() => {
          return store.getState(selectIsRunning) && !store.getState(selectIsSuspended)
        }),
      ),
      controller.stopAndRun,
    )
  }, [])

  return controller
}
