export default function SectorCard({ sector, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`card flex w-full flex-col items-start text-left transition ${
        active ? 'ring-2 ring-royal border-royal' : ''
      }`}
      aria-pressed={active}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: `${sector.color}1A` }}
        aria-hidden="true"
      >
        {sector.icon}
      </span>
      <h3 className="mt-3 text-sm font-bold text-navy">{sector.category}</h3>
      <p className="mt-1 text-xs font-semibold text-slate-400">{sector.count} scheme{sector.count === 1 ? '' : 's'}</p>
    </button>
  );
}
