'use client';

import { REPORT_TEMPLATES } from '@/types/auto-scout';
import { TemplateCard } from './TemplateCard';

interface TemplateSelectorProps {
  selected: string;
  onSelect: (templateId: string) => void;
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Report Template
        </h2>
        <p className="text-gray-400">
          Select the type of AI-generated report you want to create
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {REPORT_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={selected === template.id}
            onClick={() => onSelect(template.id)}
          />
        ))}
      </div>

      {/* Selected template info */}
      {selected && (
        <div className="p-4 rounded-xl bg-[#E4FF3B]/10 border border-[#E4FF3B]/30">
          <p className="text-sm text-white">
            <span className="font-semibold">Selected:</span>{' '}
            {REPORT_TEMPLATES.find((t) => t.id === selected)?.name}
          </p>
        </div>
      )}
    </div>
  );
}
