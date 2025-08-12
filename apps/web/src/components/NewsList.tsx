export default function NewsList() {
  // Static placeholder per Figma; wire to API later
  const items = [
    { time: "6 ч", title: "Инсайдер показал все цвета iPhone 17 и 17 Pro" },
    { time: "22 ч", title: "Студия А. Лебедева обновила упаковку Бургер Кинга" },
    { time: "28 июля", title: "В Москве обновили дизайн схемы метро" },
    { time: "28 июля", title: "Дизайнерс, давайте общаться!" },
  ];
  return (
    <aside className="rounded-3xl border border-divider bg-block shadow-1 pad-4d">
      <div className="flex items-center justify-between mb-3d">
        <h2 className="ty-h3">Новости</h2>
        <a className="ty-meta underline" href="#">Все</a>
      </div>
      <ul className="flex flex-col gap-3d">
        {items.map((n) => (
          <li key={n.title}>
            <div className="ty-meta">{n.time}</div>
            <div className="ty-title">{n.title}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
}


