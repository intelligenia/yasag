/**
 * Angular output targets. Each maps to a preset of idiom flags that drive code
 * emission across every layer (controllers, apiconfig, clean-arch, forms).
 */
export type NgTarget = 'ng22' | 'ng16' | 'legacy';

export interface TargetProfile {
  target: NgTarget;
  /** standalone components/services, no NgModules */
  standalone: boolean;
  /** inject() instead of constructor DI */
  inject: boolean;
  /** @Injectable({ providedIn: 'root' }) */
  providedInRoot: boolean;
  /** expose form-service state (loading/serverErrors) as signals */
  signals: boolean;
  /** emit httpResource() signal readers for GET operations */
  httpResource: boolean;
  /** default typed reactive forms (FormControl<T>) unless overridden */
  typedFormsDefault: boolean;
}

const PROFILES: Record<NgTarget, TargetProfile> = {
  ng22: {
    target: 'ng22',
    standalone: true, inject: true, providedInRoot: true,
    signals: true, httpResource: true, typedFormsDefault: true,
  },
  ng16: {
    target: 'ng16',
    standalone: true, inject: true, providedInRoot: true,
    signals: false, httpResource: false, typedFormsDefault: true,
  },
  legacy: {
    target: 'legacy',
    standalone: false, inject: false, providedInRoot: false,
    signals: false, httpResource: false, typedFormsDefault: false,
  },
};

export const DEFAULT_TARGET: NgTarget = 'ng22';

/** Resolves a target name to its profile; unknown names fall back to the default. */
export function profileFor(target: NgTarget): TargetProfile {
  return PROFILES[target] || PROFILES[DEFAULT_TARGET];
}
