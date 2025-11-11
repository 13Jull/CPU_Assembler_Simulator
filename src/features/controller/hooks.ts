// src/features/controller/hooks.ts
import { useEffect } from 'react'
import { store } from '@/app/store'
import { observe } from '@/common/observe'
import { UPDATE_TIMEOUT_MS } from '@/common/constants'
import { Controller } from './core'
import {
  selectAutoAssemble,
  selectIsRunning,
  selectIsSuspended,
  selectRuntimeConfiguration,
} from './controllerSlice'
import { setAssemblerError, setAssemblerState } from '@/features/assembler/assemblerSlice'
import { setEditorInput } from '@/features/editor/editorSlice'
import { debounceTime, delayWhen, filter, merge, of, timer } from 'rxjs'

// 👇 module-level singleton (this is the important part)
let sharedController: Controller | null = null

export const useController = (): Controller => {
  // create exactly one controller for the whole app
  if (!sharedController) {
    sharedController = new Controller()
  }
  const controller = sharedController

  // the effects below are the same ones you already had in your original hook
  // they just run for this singleton
  useEffect(() => {
    const autoAssemble$ = store.onState(selectAutoAssemble)
    return observe(
      autoAssemble$.pipe(debounceTime(UPDATE_TIMEOUT_MS), filter(Boolean)),
      controller.assemble,
    )
  }, [controller])

  useEffect(() => {
    const setEditorInput$ = store.onAction(setEditorInput)
    return observe(
      setEditorInput$.pipe(
        // your original logic
        filter(() => store.getState(selectAutoAssemble)),
        delayWhen(({ isFromFile }) => (isFromFile ? timer(UPDATE_TIMEOUT_MS) : of(null))),
      ),
      controller.assemble,
    )
  }, [controller])

  useEffect(() => {
    const setAssemblerState$ = store.onAction(setAssemblerState)
    const setAssemblerError$ = store.onAction(setAssemblerError)
    return observe(merge(setAssemblerState$, setAssemblerError$), controller.reset)
  }, [controller])

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
  }, [controller])

  return controller
}
