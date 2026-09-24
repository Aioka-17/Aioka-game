import { InventoryItem } from '../types/game';

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'item_flashlight',
    name: 'Полицейский фонарь',
    type: 'tool',
    description: 'Тяжёлый металлический фонарь. Излучает луч света с ультрафиолетовым спектром, отпугивающий ночных существ и проявляющий скрытые следы.',
    icon: 'flashlight',
    canEquip: true,
  },
  {
    id: 'item_bat',
    name: 'Ясеневая бита',
    type: 'weapon',
    description: 'Крепкая бейсбольная бита с обмоткой рукояти. Эффективна для защиты от материальных проявлений теней.',
    icon: 'hammer',
    canEquip: true,
  },
  {
    id: 'item_camera',
    name: 'Винтажный фотоаппарат Polaroid',
    type: 'tool',
    description: 'Фотокамера мгновенной печати 1970-х годов. Мощная магниевая вспышка на миг ослепляет призрачные силуэты и фиксирует на фотобумаге невидимые глазу аномалии.',
    icon: 'camera',
    canEquip: true,
  },
  {
    id: 'item_bandage',
    name: 'Стерильные бинты',
    type: 'consumable',
    description: 'Набор медицинских марлевых повязок. Восстанавливает 40 очков здоровья.',
    icon: 'heart-pulse',
    quantity: 2,
    canEquip: false,
  }
];

export const SPECIAL_ITEMS: Record<string, InventoryItem> = {
  item_sword: {
    id: 'item_sword',
    name: 'Старинный железный меч',
    type: 'weapon',
    description: 'Антикварный клинок, найденный в заброшенном полицейском оружейном шкафу. Наносит быстрые рубящие удары, рассекая ночных тварей.',
    icon: 'sword',
    canEquip: true,
  },
  item_precinct_key: {
    id: 'item_precinct_key',
    name: 'Ключ от участка',
    type: 'key',
    description: 'Тяжёлый латунный ключ с биркой «КОМНАТА ВЕЩДОКОВ». Отпирает оружейный арсенал в заброшенном полицейском участке.',
    icon: 'key',
    canEquip: false,
  },
  item_cellar_key: {
    id: 'item_cellar_key',
    name: 'Ключ от погреба Вэнсов',
    type: 'key',
    description: 'Старинный фигурный ключ со сколотыми зубцами. Отпирает потайную дверь в погреб в заброшенном особняке.',
    icon: 'key',
    canEquip: false,
  },
  item_pickaxe: {
    id: 'item_pickaxe',
    name: 'Шахтёрская кирка',
    type: 'tool',
    description: 'Кованая железная кирка, полученная от Элая. Позволяет разбивать хрупкие каменные завалы в штольнях шахты.',
    icon: 'pickaxe',
    canEquip: true,
  },
  item_rusty_key: {
    id: 'item_rusty_key',
    name: 'Латунный ключ №13',
    type: 'key',
    description: 'Тяжёлый выветренный ключ с выгравированной цифрой 13. Отпирает железные врата в крипту церкви святого Иуды.',
    icon: 'key',
    canEquip: false,
  },
  item_battery: {
    id: 'item_battery',
    name: 'Комплект щелочных батареек',
    type: 'consumable',
    description: 'Свежие 9-вольтовые батареи. Полностью заряжают аккумулятор фонаря.',
    icon: 'battery-charging',
    quantity: 2,
    canEquip: false,
  }
};
