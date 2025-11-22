'use client';

import { useEffect } from 'react';
import { useAssetCategories, useAssetTypes } from '@/hooks/useApi';

interface AssetCategoryTypeSelectorProps {
  categoryId?: number;
  typeId?: number;
  onCategoryChange?: (categoryId: number) => void;
  onTypeChange?: (typeId: number) => void;
  required?: boolean;
  disabled?: boolean;
  showLabels?: boolean;
  className?: string;
}

/**
 * AssetCategoryTypeSelector - Cascading asset category and type selection
 * 
 * Usage:
 * ```tsx
 * <AssetCategoryTypeSelector
 *   categoryId={formData.category_id}
 *   typeId={formData.asset_type_id}
 *   onCategoryChange={(id) => setFormData(prev => ({ ...prev, category_id: id }))}
 *   onTypeChange={(id) => setFormData(prev => ({ ...prev, asset_type_id: id }))}
 *   required
 * />
 * ```
 */
export default function AssetCategoryTypeSelector({
  categoryId,
  typeId,
  onCategoryChange,
  onTypeChange,
  required = false,
  disabled = false,
  showLabels = true,
  className = '',
}: AssetCategoryTypeSelectorProps) {
  // Fetch data
  const { data: categories = [], isLoading: categoriesLoading } = useAssetCategories();
  const { data: types = [], isLoading: typesLoading } = useAssetTypes(
    categoryId ? { category_id: categoryId } : undefined
  );

  // Reset type when category changes
  useEffect(() => {
    if (!categoryId && typeId && onTypeChange) {
      onTypeChange(0);
    }
  }, [categoryId, typeId, onTypeChange]);

  const baseSelectClass = `w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    disabled:bg-gray-100 disabled:cursor-not-allowed`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Selector */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Category {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          value={categoryId || ''}
          onChange={(e) => onCategoryChange && onCategoryChange(Number(e.target.value))}
          disabled={disabled || categoriesLoading}
          required={required}
          className={baseSelectClass}
        >
          <option value="">
            {categoriesLoading ? 'Loading categories...' : 'Select a category'}
          </option>
          {categories.map((category: any) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.asset_types_count > 0 && ` (${category.asset_types_count} types)`}
            </option>
          ))}
        </select>
        {categories.length === 0 && !categoriesLoading && (
          <p className="mt-1 text-sm text-gray-500">No asset categories available</p>
        )}
      </div>

      {/* Type Selector */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Type {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          value={typeId || ''}
          onChange={(e) => onTypeChange && onTypeChange(Number(e.target.value))}
          disabled={disabled || !categoryId || typesLoading}
          required={required}
          className={baseSelectClass}
        >
          <option value="">
            {!categoryId
              ? 'Select category first'
              : typesLoading
              ? 'Loading types...'
              : 'Select an asset type'}
          </option>
          {types.map((type: any) => (
            <option key={type.id} value={type.id}>
              {type.name}
              {type.model && ` - ${type.model}`}
            </option>
          ))}
        </select>
        {types.length === 0 && categoryId && !typesLoading && (
          <p className="mt-1 text-sm text-gray-500">
            No asset types found for this category
          </p>
        )}
      </div>
    </div>
  );
}
