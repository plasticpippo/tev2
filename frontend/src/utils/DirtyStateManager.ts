import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';

/**
 * Custom comparator function type for field-level comparison
 */
export type FieldComparator<T = any> = (a: T, b: T) => boolean;

/**
 * Configuration options for DirtyStateManager
 */
export interface DirtyStateManagerConfig<T> {
  /** Custom comparators for specific fields */
  fieldComparators?: Record<string, FieldComparator>;
  /** Whether to track nested field changes separately */
  trackNestedFields?: boolean;
}

/**
 * DirtyStateManager - A utility class for reliable dirty state management
 *
 * Tracks changes to data objects using deep comparison and provides
 * methods to check, reset, and manage dirty state.
 *
 * @template T - The type of data being tracked
 */
export class DirtyStateManager<T extends Record<string, any>> {
  private initialData: T;
  private savedData: T;
  private currentData: T;
  private dirtyFields: Set<string>;
  private config: DirtyStateManagerConfig<T>;
  private isSaving: boolean;

  /**
   * Creates a new DirtyStateManager instance
   *
   * @param initialData - The initial data object to track
   * @param config - Optional configuration for custom comparators
   */
  constructor(initialData: T, config: DirtyStateManagerConfig<T> = {}) {
    this.initialData = cloneDeep(initialData);
    this.savedData = cloneDeep(initialData);
    this.currentData = cloneDeep(initialData);
    this.dirtyFields = new Set<string>();
    this.config = {
      trackNestedFields: true,
      ...config,
    };
    this.isSaving = false;
  }

  /**
   * Gets a value at a nested path using dot notation
   *
   * @param obj - The object to traverse
   * @param path - The dot-notated path (e.g., "gridSettings.columns")
   * @returns The value at the path, or undefined if not found
   */
  private getValueAtPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Sets a value at a nested path using dot notation
   *
   * @param obj - The object to modify
   * @param path - The dot-notated path (e.g., "gridSettings.columns")
   * @param value - The value to set
   * @returns A new object with the value set at the path
   */
  private setValueAtPath(obj: any, path: string, value: any): any {
    const keys = path.split('.');
    const result = cloneDeep(obj);
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return result;
  }

  /**
   * Compares two values using custom comparator if available, or lodash isEqual
   *
   * @param field - The field name being compared
   * @param a - First value
   * @param b - Second value
   * @returns True if values are equal
   */
  private compareValues(field: string, a: any, b: any): boolean {
    // Check for custom comparator
    if (this.config.fieldComparators?.[field]) {
      return this.config.fieldComparators[field](a, b);
    }

    // Use lodash isEqual for deep comparison
    return isEqual(a, b);
  }

  /**
   * Updates the entire data object and tracks changes
   *
   * @param newData - The new data object
   */
  update(newData: T): void {
    if (this.isSaving) {
      console.warn('DirtyStateManager: Update called while save operation is in progress');
    }

    const newDirtyFields = new Set<string>();

    // Compare each top-level field
    for (const key of Object.keys(newData)) {
      const oldValue = this.savedData[key];
      const newValue = newData[key];

      if (!this.compareValues(key, oldValue, newValue)) {
        newDirtyFields.add(key);
      }
    }

    // Also check for removed fields
    for (const key of Object.keys(this.savedData)) {
      if (!(key in newData)) {
        newDirtyFields.add(key);
      }
    }

    this.currentData = cloneDeep(newData);
    this.dirtyFields = newDirtyFields;
  }

  /**
   * Updates a single field and tracks the change
   *
   * @param field - The field name to update
   * @param value - The new value
   */
  updateField<K extends keyof T>(field: K, value: T[K]): void {
    if (this.isSaving) {
      console.warn('DirtyStateManager: Update called while save operation is in progress');
    }

    const oldValue = this.savedData[field];
    const fieldName = String(field);

    this.currentData = {
      ...this.currentData,
      [field]: value,
    };

    if (!this.compareValues(fieldName, oldValue, value)) {
      this.dirtyFields.add(fieldName);
    } else {
      this.dirtyFields.delete(fieldName);
    }
  }

  /**
   * Updates a nested field using dot notation and tracks the change
   *
   * @param path - The dot-notated path (e.g., "gridSettings.columns")
   * @param value - The new value
   */
  updateNestedField(path: string, value: any): void {
    if (this.isSaving) {
      console.warn('DirtyStateManager: Update called while save operation is in progress');
    }

    const oldValue = this.getValueAtPath(this.savedData, path);
    const topLevelField = path.split('.')[0];

    this.currentData = this.setValueAtPath(this.currentData, path, value);

    // Check if the nested change affects the dirty state of the top-level field
    const newTopLevelValue = this.currentData[topLevelField];
    const oldTopLevelValue = this.savedData[topLevelField];

    if (!this.compareValues(topLevelField, oldTopLevelValue, newTopLevelValue)) {
      this.dirtyFields.add(topLevelField);

      // If tracking nested fields, also track the specific path
      if (this.config.trackNestedFields) {
        this.dirtyFields.add(path);
      }
    } else {
      this.dirtyFields.delete(topLevelField);
      if (this.config.trackNestedFields) {
        this.dirtyFields.delete(path);
      }
    }
  }

  /**
   * Checks if the data is dirty
   *
   * @param field - Optional field name to check. If not provided, checks global dirty state
   * @returns True if dirty
   */
  isDirty(field?: string): boolean {
    if (field !== undefined) {
      return this.dirtyFields.has(field);
    }
    return this.dirtyFields.size > 0;
  }

  /**
   * Gets an array of dirty field names
   *
   * @returns Array of dirty field names
   */
  getDirtyFields(): string[] {
    return Array.from(this.dirtyFields);
  }

  /**
   * Marks the current state as saved
   * Resets dirty state and updates saved data to current data
   *
   * @returns Promise that resolves when save is complete
   */
  async markSaved(): Promise<void> {
    this.isSaving = true;

    try {
      // Simulate save operation completion
      await new Promise(resolve => setTimeout(resolve, 0));

      this.savedData = cloneDeep(this.currentData);
      this.dirtyFields.clear();
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Resets to the initial state (when first created)
   */
  reset(): void {
    if (this.isSaving) {
      console.warn('DirtyStateManager: Reset called while save operation is in progress');
      return;
    }

    this.currentData = cloneDeep(this.initialData);
    this.savedData = cloneDeep(this.initialData);
    this.dirtyFields.clear();
  }

  /**
   * Discards changes and reverts to the last saved state
   */
  discardChanges(): void {
    if (this.isSaving) {
      console.warn('DirtyStateManager: Discard called while save operation is in progress');
      return;
    }

    this.currentData = cloneDeep(this.savedData);
    this.dirtyFields.clear();
  }

  /**
   * Gets the current data
   *
   * @returns A deep clone of the current data
   */
  getCurrentData(): T {
    return cloneDeep(this.currentData);
  }

  /**
   * Gets the saved data (last marked as saved)
   *
   * @returns A deep clone of the saved data
   */
  getSavedData(): T {
    return cloneDeep(this.savedData);
  }

  /**
   * Gets the initial data (when first created)
   *
   * @returns A deep clone of the initial data
   */
  getInitialData(): T {
    return cloneDeep(this.initialData);
  }

  /**
   * Checks if a save operation is currently in progress
   *
   * @returns True if saving
   */
  getIsSaving(): boolean {
    return this.isSaving;
  }
}

export default DirtyStateManager;
