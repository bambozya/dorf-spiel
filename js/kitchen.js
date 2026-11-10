// ================= Küchengeräte: alles benutzbar =================
const RECIPES = {
  oven: [
    ['bread', 'Brot backen', { wheat: 3 }],
    ['cake', 'Karottenkuchen backen', { wheat: 2, carrot: 2 }],
    ['pie', 'Kürbiskuchen backen', { wheat: 2, pumpkin: 1 }],
  ],
  stove: [
    ['soup', 'Kürbissuppe kochen', { carrot: 2, pumpkin: 1 }, 1],
    ['ffish', 'Fisch braten', { fish: 1 }],
  ],
  counter: [['salad', 'Karottensalat schneiden', { carrot: 2 }]],
};

const APPL = { oven: 'Backofen', stove: 'Herd', counter: 'Arbeitsplatte' };

function kitchenUse(kind) {
  const n = scene.house.n;
  if (kind === 'fridge') {
    if (!hasPower(n))
      return toast(
        'Der Kühlschrank ist warm, weil Haus ' + n + ' keinen Strom hat. Drinnen: ' + FRIDGE + '.',
      );
    player.work = {
      kind: 'cook',
      t: 0,
      dur: 0.8,
      fx: 'cold',
      fin: () =>
        toast(
          'Du trinkst ein Glas kalte Milch. Lecker! Im Kühlschrank sind ' + FRIDGE + ' für deine Rezepte.',
          4500,
        ),
    };
    return;
  }
  if (kind === 'pantry')
    return toast(
      '<b>Vorratsregal:</b> ' + PANTRY + '. Das brauchst du zum Backen, es ist immer genug da.',
      5000,
    );
  if (kind === 'sink') {
    if (!needWater(n)) return;
    player.work = {
      kind: 'cook',
      t: 0,
      dur: 0.9,
      fx: 'water',
      fin: () => {
        if (hasTool('can')) {
          float(player.x, player.y - 1.6, 'Gießkanne voll', '#bfe8ff');
          toast('Du wäschst dir die Hände und füllst die Gießkanne auf.');
        } else toast('Du wäschst dir die Hände. Sauber!');
      },
    };
    return;
  }
  const rs = RECIPES[kind];
  if (!rs) return;
  if ((kind === 'oven' || kind === 'stove') && !hasPower(n))
    return toast(
      `Ohne Strom geht der ${APPL[kind]} nicht. Haus ${n} braucht noch Strom (steht auf dem Zettel).`,
    );
  openModal(`<h2>${APPL[kind]}</h2><p>Was möchtest du machen? Mehl, Zucker, Eier, Milch und Gewürze sind in der Küche.</p><div class="recipes">${rs
    .map(([out, name, need, water], i) => {
      const ok = has(need) && (!water || hasWater(n));
      return `<div class="recipe"><img src="${iconURL(out)}" alt=""><div><b>${name}</b><br><span>${fmtB(need)}${water ? ' + Wasser' : ''} → 1 ${ITEMS[out].n}</span><br><small>Verkauf im Marktdorf: ${ITEMS[out].price} Münzen</small></div><button class="go" data-i="${i}" ${ok ? '' : 'disabled'}>${ok ? 'Los' : 'Fehlt noch'}</button></div>`;
    })
    .join('')}</div>
    <div class="actions"><button id="cls">Schließen</button></div>`);
  $('cls').onclick = closeModal;
  sheet.querySelectorAll('.recipe button').forEach(
    (b) =>
      (b.onclick = () => {
        const [out, name, need, water] = rs[+b.dataset.i];
        if (!has(need) || (water && !hasWater(n))) return;
        closeModal();
        take(need);
        player.work = {
          kind: 'cook',
          t: 0,
          dur: 1.6,
          fx: kind === 'oven' ? 'oven' : kind === 'stove' ? 'steam' : 'chop',
          fin: () => {
            give({ [out]: 1 });
            float(player.x, player.y - 1.8, '+1 ' + ITEMS[out].n, '#ffb36b');
            moment('cook_' + out, 'Zum ersten Mal gemacht: ' + ITEMS[out].n + '!', out);
            changed();
          },
        };
      }),
  );
}
