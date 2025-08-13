"use client";
import SiteShell from "@/components/SiteShell";

const ColorSwatch = ({ name, varName }: { name: string; varName: string }) => (
  <div className="flex items-center gap-3 rounded-xl border border-divider p-3 bg-block">
    <div className="w-10 h-10 rounded-lg border border-border" style={{ background: `var(${varName})` }} />
    <div className="text-sm">
      <div className="font-medium">{name}</div>
      <div className="opacity-70">{varName}</div>
    </div>
  </div>
);

const ButtonDemo = ({ title, className }: { title: string; className: string }) => (
  <div className="flex items-center gap-3 rounded-xl border border-divider p-3 bg-block">
    <div className="w-40">{title}</div>
    <div className="flex items-center gap-2">
      <button className={`${className} px-4 py-2 rounded`}>Default</button>
      <button className={`${className} px-4 py-2 rounded`} disabled>
        Disabled
      </button>
      <button className={`${className} px-4 py-2 rounded`}>Hover</button>
      <button className={`${className} px-4 py-2 rounded`}>Active</button>
    </div>
  </div>
);

export default function DesignSystemPage() {
  return (
    <SiteShell>
      <h1 className="ty-h2 mb-3d">Design System</h1>

      <section className="mb-6">
        <h2 className="ty-h3 mb-2">Colors</h2>
        <div className="puk-grid">
          <div className="puk-col-12 md-puk-col-6 lg-puk-col-4">
            <ColorSwatch name="bgPrimaryPage" varName="--bgPrimaryPage" />
          </div>
          <div className="puk-col-12 md-puk-col-6 lg-puk-col-4">
            <ColorSwatch name="bgPrimaryBlock" varName="--bgPrimaryBlock" />
          </div>
          <div className="puk-col-12 md-puk-col-6 lg-puk-col-4">
            <ColorSwatch name="bgTertiaryBlock" varName="--bgTertiaryBlock" />
          </div>
          <div className="puk-col-12 md-puk-col-6 lg-puk-col-4">
            <ColorSwatch name="textPrimary" varName="--textPrimary" />
          </div>
          <div className="puk-col-12 md-puk-col-6 lg-puk-col-4">
            <ColorSwatch name="textSecondary" varName="--textSecondary" />
          </div>
          <div className="puk-col-12 md-puk-col-6 lg-puk-col-4">
            <ColorSwatch name="strokeDivider" varName="--strokeDivider" />
          </div>
          <div className="puk-col-12 md-puk-col-6 lg-puk-col-4">
            <ColorSwatch name="bgBrand" varName="--bgBrand" />
          </div>
          <div className="puk-col-12 md-puk-col-6 lg-puk-col-4">
            <ColorSwatch name="bgStatusSuccess" varName="--bgStatusSuccess" />
          </div>
          <div className="puk-col-12 md-puk-col-6 lg-puk-col-4">
            <ColorSwatch name="bgStatusAlert" varName="--bgStatusAlert" />
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="ty-h3 mb-2">Buttons</h2>
        <div className="space-y-3">
          <ButtonDemo title="Primary" className="btn-primary" />
          <ButtonDemo title="Secondary" className="btn-secondary" />
          <ButtonDemo title="Brand" className="btn-brand" />
          <ButtonDemo title="Inverted" className="btn-inverted" />
          <ButtonDemo title="Ghost" className="btn-ghost" />
          <ButtonDemo title="Action" className="btn-action" />
          <ButtonDemo title="Success" className="btn-success" />
          <ButtonDemo title="Alert" className="btn-alert" />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="ty-h3 mb-2">Typography</h2>
        <div className="rounded-xl border border-divider p-3 bg-block space-y-2">
          <div className="ty-h1">H1 Заголовок</div>
          <div className="ty-h2">H2 Заголовок</div>
          <div className="ty-h3">H3 Заголовок</div>
          <div className="ty-subtitle">Подзаголовок</div>
          <div className="ty-body">Текст абзаца</div>
          <div className="ty-meta">Мета текст</div>
        </div>
      </section>
    </SiteShell>
  );
}


