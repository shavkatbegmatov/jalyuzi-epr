import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Star } from 'lucide-react';
import clsx from 'clsx';
import type { AttributeFamily } from '../../../types';

export type SelectableMode = 'all' | 'leafOnly';

interface FamilyTreeViewProps {
  nodes: AttributeFamily[];
  selectedId: number | null;
  onSelect: (node: AttributeFamily) => void;
  selectableMode?: SelectableMode;
}

export function FamilyTreeView({ nodes, selectedId, onSelect, selectableMode = 'all' }: FamilyTreeViewProps) {
  if (!nodes || nodes.length === 0) {
    return <p className="px-3 py-6 text-center text-sm text-base-content/50">Daraxt bo'sh</p>;
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {nodes.map((n) => (
        <FamilyTreeNode key={n.id} node={n} depth={0} selectedId={selectedId} onSelect={onSelect} selectableMode={selectableMode} />
      ))}
    </ul>
  );
}

interface NodeProps {
  node: AttributeFamily;
  depth: number;
  selectedId: number | null;
  onSelect: (node: AttributeFamily) => void;
  selectableMode: SelectableMode;
}

function FamilyTreeNode({ node, depth, selectedId, onSelect, selectableMode }: NodeProps) {
  const [open, setOpen] = useState(true);
  const hasChildren = !!node.children && node.children.length > 0;
  const isLeaf = node.leaf ?? !hasChildren;
  const selectable = selectableMode === 'all' || isLeaf;
  const active = selectedId === node.id;
  const ownCount = node.attributeSchema?.attributes?.length ?? 0;

  const handleClick = () => {
    if (selectable) onSelect(node);
    else setOpen((o) => !o);
  };

  return (
    <li>
      <div
        className={clsx(
          'group flex items-center gap-1.5 rounded-lg py-1.5 pr-2 text-sm transition-colors',
          selectable ? 'cursor-pointer' : 'cursor-default',
          active ? 'bg-primary/10 text-primary' : 'hover:bg-base-200/70'
        )}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            type="button"
            className="grid h-5 w-5 shrink-0 place-items-center rounded text-base-content/50 hover:text-base-content"
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {isLeaf ? <FileText className="h-4 w-4 shrink-0 text-base-content/50" /> : <Folder className="h-4 w-4 shrink-0 text-warning" />}

        <span className={clsx('truncate', active && 'font-semibold')}>{node.name}</span>

        {isLeaf && (
          <span className="badge badge-ghost badge-xs gap-0.5" title="Barg — mahsulot shu yerda yaratiladi">
            <Star className="h-2.5 w-2.5" />barg
          </span>
        )}
        {ownCount > 0 && (
          <span className="ml-auto badge badge-neutral badge-xs" title="Shu tugun atributlari">{ownCount}</span>
        )}
      </div>

      {hasChildren && open && (
        <ul className="flex flex-col gap-0.5">
          {node.children!.map((c) => (
            <FamilyTreeNode key={c.id} node={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} selectableMode={selectableMode} />
          ))}
        </ul>
      )}
    </li>
  );
}
