import { useSyncExternalStore } from 'react'
import { taskStore } from '../lib/taskStore.js'

/**
 * Subscribe to the shared task store. Re-renders whenever the store state
 * reference changes (the store always assigns a new object on update).
 */
export function useTaskStore() {
  return useSyncExternalStore(
    taskStore.subscribe,
    taskStore.getState,
    taskStore.getState,
  )
}
