import Icon from "./Icon";

interface TopBarProps {
  onReset: () => void;
}

export default function TopBar({ onReset }: TopBarProps) {
  return (
    <header className="flex min-h-[78px] items-center justify-between border-b border-slate-200">
      <a className="inline-flex items-center gap-3 font-display text-2xl font-bold tracking-tight text-[#111b2c] no-underline" href="./" aria-label="md2pdf home">
        <span className="grid size-10 place-items-center rounded-xl bg-[#fff0eb] text-[#f2633d]" aria-hidden="true">
          <Icon name="fileDocument" />
        </span>
        <span>
          md<span className="text-[#f2633d]">2</span>pdf
        </span>
      </a>
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-2 font-mono text-xs text-slate-500 sm:flex">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(96,188,135,.14)]" /> wkhtmltopdf core
        </div>
        <button
          className="grid size-10 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
          type="button"
          title="Khôi phục nội dung mẫu"
          aria-label="Khôi phục nội dung mẫu"
          onClick={onReset}
        >
          <Icon name="reset" />
        </button>
        <button className="grid size-10 place-items-center rounded-xl bg-[#111b2c] text-sm font-semibold text-white" type="button" title="Workspace">
          A
        </button>
      </div>
    </header>
  );
}
