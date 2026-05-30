import { Network, CheckCircle2 } from 'lucide-react';
import { FamilyTreeView } from '../attribute-families/FamilyTreeView';
import type { AttributeFamily } from '../../../types';

interface FamilyPickerStepProps {
  tree: AttributeFamily[];
  selectedFamilyId: number | null;
  selectedFamily: AttributeFamily | null;
  onSelect: (family: AttributeFamily) => void;
  loading: boolean;
  error?: string;
}

export function FamilyPickerStep({ tree, selectedFamilyId, selectedFamily, onSelect, loading, error }: FamilyPickerStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Atribut oilasini tanlang</h2>
        <p className="text-sm text-base-content/60">
          Daraxtning eng quyi (barg) tugunini tanlang — mahsulot xususiyatlari o'sha tugundan meros bo'yicha olinadi.
        </p>
      </div>

      {error && <div className="alert alert-error"><span>{error}</span></div>}

      {loading ? (
        <div className="flex h-48 items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>
      ) : tree.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-2 p-8 text-center text-base-content/60">
          <Network className="h-8 w-8" />
          <p>Atribut oilasi daraxti bo'sh. Avval "Atribut oilasi" bo'limida daraxt va barg tugunlar yarating.</p>
        </div>
      ) : (
        <div className="surface-card p-3">
          <FamilyTreeView nodes={tree} selectedId={selectedFamilyId} onSelect={onSelect} selectableMode="leafOnly" />
        </div>
      )}

      {selectedFamily && (
        <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Tanlandi: {selectedFamily.name}</span>
        </div>
      )}
    </div>
  );
}
