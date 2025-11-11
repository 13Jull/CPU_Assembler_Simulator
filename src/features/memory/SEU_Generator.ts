// runControl.ts
import { firstValueFrom } from 'rxjs'
import type { Observable } from 'rxjs'

export async function runControl<T>(
  gen: Generator<Observable<unknown>, T, unknown>
): Promise<T> {
  let next = gen.next()
  while (!next.done) {
    await firstValueFrom(next.value)
    next = gen.next()
  }
  return next.value
}
