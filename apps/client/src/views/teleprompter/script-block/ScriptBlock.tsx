import type { ScriptBlock } from '../teleprompter.types';

interface ScriptBlockProps {
  block: ScriptBlock;
  registerRef: (id: string, element: HTMLElement | null) => void;
}

export default function ScriptBlockView({ block, registerRef }: ScriptBlockProps) {
  'use memo';

  return (
    <section
      className='teleprompter__block'
      ref={(element) => registerRef(block.id, element)}
      data-loaded={block.isLoaded || undefined}
    >
      {block.groupTitle && <div className='teleprompter__group'>{block.groupTitle}</div>}
      {block.heading && <h2 className='teleprompter__heading'>{block.heading}</h2>}
      <p className='teleprompter__body'>{block.text}</p>
    </section>
  );
}
