/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DialogueNode, GameWorldState, NPC } from '../types';
import { ITEMS } from '../items';
import { addItemToInventory, applyQuestEndingOutcome } from '../engine/rules';

export function createInitialNPCs(): Record<string, NPC> {
  return {
    clerk_korniyenko: {
      id: 'clerk_korniyenko',
      name: 'Інспектор Корнієнко',
      role: 'Митний клерк Консорціуму О2',
      faction: 'corp',
      x: 14 * 16,
      y: 7 * 16,
      dir: 'down',
      dialogueRoot: 'clerk_greeting',
      attitude: 0,
      mapId: 'customs_dock',
      portrait: 'clerk',
    },
    foreman_taras: {
      id: 'foreman_taras',
      name: 'Бригадир Тарас',
      role: 'Голова Профспілки докерів',
      faction: 'syndicate',
      x: 12 * 16,
      y: 10 * 16,
      dir: 'down',
      dialogueRoot: 'taras_greeting',
      attitude: 10,
      mapId: 'industrial_market',
      portrait: 'foreman',
    },
    vendor_zoryana: {
      id: 'vendor_zoryana',
      name: 'Зоряна',
      role: 'Торговка вузлами та схемами',
      faction: 'smugglers',
      x: 6 * 16,
      y: 5 * 16,
      dir: 'down',
      dialogueRoot: 'zoryana_greeting',
      attitude: 5,
      mapId: 'industrial_market',
      isVendor: true,
      vendorInventory: [
        { itemId: 'medkit_stim', price: 40, stock: 5 },
        { itemId: 'oxygen_tank', price: 30, stock: 4 },
        { itemId: 'bypass_keycard', price: 80, stock: 1 },
        { itemId: 'scrubber_filter', price: 110, stock: 1 },
      ],
      portrait: 'smuggler',
    },
    tech_nestor: {
      id: 'tech_nestor',
      name: 'Інженер Нестор',
      role: 'Опальний технік підпалуби',
      faction: 'smugglers',
      x: 7 * 16,
      y: 14 * 16,
      dir: 'right',
      dialogueRoot: 'nestor_greeting',
      attitude: 0,
      mapId: 'underdeck_sublevel',
      portrait: 'technician',
    },
    neos_core: {
      id: 'neos_core',
      name: 'Суб-ядро «НЕОС-9»',
      role: 'Автономний координатор життєзабезпечення',
      faction: 'corp',
      x: 14 * 16,
      y: 8 * 16,
      dir: 'down',
      dialogueRoot: 'neos_greeting',
      attitude: 0,
      mapId: 'underdeck_sublevel',
      portrait: 'core_ai',
    },
  };
}

export function getDialogueNodes(): Record<string, DialogueNode> {
  return {
    // --------------------------------------------------
    // CLERK KORNIYENKO
    // --------------------------------------------------
    clerk_greeting: {
      id: 'clerk_greeting',
      speaker: 'Інспектор Корнієнко',
      text: 'Ласкаво просимо на «Периферію-9». Ваш базовий пакет дихання прибулого вичерпано на 82%. Поточний тариф — 25 кредитів за декаду. Ви за ділом чи плануєте накопичувати борг?',
      choices: [
        {
          text: 'Що тут відбувається з киснем? Чому такі дикі ціни?',
          nextNodeId: 'clerk_oxygen_explanation',
        },
        {
          text: 'Я шукаю підробіток. Хто платить кредитами?',
          nextNodeId: 'clerk_job_offer',
        },
        {
          text: 'Маю дані про штучне перекриття рециркулятора (Передати докази Консорціуму)',
          nextNodeId: 'clerk_submit_evidence',
          condition: (state: GameWorldState) =>
            state.inventory.some((s) => s.item.id === 'decrypted_evidence' || s.item.id === 'encrypted_drive'),
        },
        {
          text: 'Бувайте. Я сам розберуся.',
        },
      ],
    },
    clerk_oxygen_explanation: {
      id: 'clerk_oxygen_explanation',
      speaker: 'Інспектор Корнієнко',
      text: '«Дикі ціни» — це мова неплатоспроможних, шановний. Це ринкове ціноутворення згідно з пунктом 8-B Регламенту Консорціуму. Головний рециркулятор у підпалубі нібито саботовано якимось звільненим техніком. Попит перевищує пропозицію.',
      choices: [
        {
          text: 'І хто цей саботажник?',
          nextNodeId: 'clerk_saboteur_info',
        },
        {
          text: 'Зрозуміло. Де тут базар?',
          nextNodeId: 'clerk_market_direction',
        },
      ],
    },
    clerk_saboteur_info: {
      id: 'clerk_saboteur_info',
      speaker: 'Інспектор Корнієнко',
      text: 'Колишній старший інженер Нестор. Він зник у вентиляційних тунелях аварійної палуби. Якщо знайдете його або деталі блоку управління — Консорціум щедро компенсує послуги.',
      choices: [
        {
          text: 'Я перевірю підпалубу.',
          action: (state) => {
            state.quests.stage = 'find_technician';
          },
        },
      ],
    },
    clerk_job_offer: {
      id: 'clerk_job_offer',
      speaker: 'Інспектор Корнієнко',
      text: 'Пройдіть через шлюз на Індустріальний базар. Там крутяться докери Тараса і чорні перекупники. Якщо знайдете будь-які диверсійні схеми або носії даних із підпалуби — несіть мені. Корпорація не забуває лояльності.',
      choices: [
        {
          text: 'Домовилися.',
        },
      ],
    },
    clerk_market_direction: {
      id: 'clerk_market_direction',
      speaker: 'Інспектор Корнієнко',
      text: 'Праворуч через захисний гермошлюз. Намагайтеся не дихати надто глибоко — лічильник боргу цокає щохвилини.',
      choices: [{ text: 'Дякую за "турботу".' }],
    },
    clerk_submit_evidence: {
      id: 'clerk_submit_evidence',
      speaker: 'Інспектор Корнієнко',
      text: 'Чекайте... Це телеметрія дирекції?! (Його очі бігають по планшету). «Знизити тиск на 40% для стимуляції рефінансування»... Боги, це підтвердження. Але Консорціум цінує тишу набагато дорожче, ніж бунти голодних докерів.',
      choices: [
        {
          text: '[Угода] Віддати диск. Мені потрібні кредити та безлімітний кисень.',
          nextNodeId: 'clerk_ending_corp',
          outcomeEnding: 'corp',
          action: (state) => {
            applyQuestEndingOutcome(state, 'corp');
          },
        },
        {
          text: 'Я ще подумаю. Не квапте події.',
        },
      ],
    },
    clerk_ending_corp: {
      id: 'clerk_ending_corp',
      speaker: 'Інспектор Корнієнко',
      text: 'Розумне рішення громадянина майбутнього! Ось ваша VIP-картка нульового балансу та тисяча кредитів. Докери трохи побурчать і візьмуть нові позики, зате станція залишиться стабільною.',
      choices: [{ text: 'Завершити розмову.' }],
    },

    // --------------------------------------------------
    // FOREMAN TARAS
    // --------------------------------------------------
    taras_greeting: {
      id: 'taras_greeting',
      speaker: 'Бригадир Тарас',
      text: '(Він важко кашляє, притискаючи респіратор). Черговий гість із доків? Якщо ти від клерків — іди до біса. Якщо шукаєш чесну роботу — у нас тут задихається вся зміна, бо норму кисню знову урізали.',
      choices: [
        {
          text: 'Чому ви вважаєте, що кисень урізали навмисно?',
          nextNodeId: 'taras_conspiracy',
        },
        {
          text: 'Де дістати ключ від технічного люка підпалуби?',
          nextNodeId: 'taras_subdeck_key',
        },
        {
          text: '[Повстання] Тарасе, ось докази: Корпорація навмисне заблокувала рециркулятор!',
          nextNodeId: 'taras_submit_evidence',
          condition: (state: GameWorldState) =>
            state.inventory.some((s) => s.item.id === 'decrypted_evidence'),
        },
        {
          text: 'Тримайся, Тарасе. Я ще озирнуся.',
        },
      ],
    },
    taras_conspiracy: {
      id: 'taras_conspiracy',
      speaker: 'Бригадир Тарас',
      text: 'Бо фільтри забилися не за рік, а за одну ніч після того, як рада директорів оголосила про нову ставку кредитування! Вони хочуть, щоб ми підписали довічне рабство за ковток повітря. Інженер Нестор намагався запустити аварійний байпас, але його оголосили злочинцем.',
      choices: [
        {
          text: 'Де зараз Нестор?',
          nextNodeId: 'taras_nestor_location',
        },
        {
          text: 'Як можна запустити рециркулятор?',
          nextNodeId: 'taras_repair_info',
        },
      ],
    },
    taras_nestor_location: {
      id: 'taras_nestor_location',
      speaker: 'Бригадир Тарас',
      text: 'Він засів у службовому коридорі біля серверної підпалуби. Але прямий люк заблокований замком Консорціуму. Тобі потрібна або ключ-карта, або шукай стару вентиляційну решітку в правому кутку цього базару.',
      choices: [
        {
          text: 'Зрозумів. Дякую за наводку.',
        },
      ],
    },
    taras_repair_info: {
      id: 'taras_repair_info',
      speaker: 'Бригадир Тарас',
      text: 'Потрібні три речі: іонообмінний фільтр, кріо-холодоагент, щоб не згоріли котушки, і плата логіки для запуску байпасу. Знайди це в скринях підпалуби або виміняй у Зоряни.',
      choices: [
        {
          text: 'Я візьмуся за це.',
          action: (state) => {
            state.quests.stage = 'gather_parts';
          },
        },
      ],
    },
    taras_subdeck_key: {
      id: 'taras_subdeck_key',
      speaker: 'Бригадир Тарас',
      text: 'Зоряна торгує підробленими ключами, або пошукай у вентиляції праворуч — там можна протиснутися повз датчики замків.',
      choices: [{ text: 'Я перевірю обидва шляхи.' }],
    },
    taras_submit_evidence: {
      id: 'taras_submit_evidence',
      speaker: 'Бригадир Тарас',
      text: '(Він вдивляється в розшифровані графіки, його кулаки стискаються). «Штучне зниження парціального тиску»... Сволота! Вони труїли моїх людей заради котирувань акцій! З цим диском я підніму всі три термінали докерів!',
      choices: [
        {
          text: '[Солідарність] Забирай докази. Час повернути станцію тим, хто на ній працює!',
          nextNodeId: 'taras_ending_syndicate',
          outcomeEnding: 'syndicate',
          action: (state) => {
            applyQuestEndingOutcome(state, 'syndicate');
          },
        },
        {
          text: 'Зачекай. Треба все зважити.',
        },
      ],
    },
    taras_ending_syndicate: {
      id: 'taras_ending_syndicate',
      speaker: 'Бригадир Тарас',
      text: 'Слава тобі, друже! Докери вже перекривають гермоворота на доках і беруть розподільчий щит під контроль. Борги скасовано, повітря буде спільним! Консорціум оголосить блокаду, але ми встоїмо!',
      choices: [{ text: 'Завершити розмову.' }],
    },

    // --------------------------------------------------
    // VENDOR ZORYANA
    // --------------------------------------------------
    zoryana_greeting: {
      id: 'zoryana_greeting',
      speaker: 'Зоряна',
      text: 'Тсс. Не світи кредитами. У мене найкращий товар на цій бляшанці: очищені фільтри, охолоджувачі й чіпи доступу. Все з перших рук, без сплати податку Консорціуму.',
      choices: [
        {
          text: 'Покажи, що маєш на продаж.',
          action: (state) => {
            state.flags['open_trade_zoryana'] = true;
          },
        },
        {
          text: 'Ти чула щось про саботаж рециркулятора?',
          nextNodeId: 'zoryana_rumors',
        },
        {
          text: 'Мені треба розшифрувати цей накопичувач Консорціуму.',
          nextNodeId: 'zoryana_decrypt_drive',
          condition: (state: GameWorldState) =>
            state.inventory.some((s) => s.item.id === 'encrypted_drive'),
        },
        {
          text: 'Я просто дивлюся.',
        },
      ],
    },
    zoryana_rumors: {
      id: 'zoryana_rumors',
      speaker: 'Зоряна',
      text: 'Саботаж? Ха! Саботаж — це коли зламалося випадково. А коли на підпалубу перед аварією спускаються охоронні боти в режимі патрулювання — це спланована акція. Нестор бідолаха просто опинився не в той час не в тому місці.',
      choices: [
        {
          text: 'Як дістатися до Нестора?',
          nextNodeId: 'zoryana_path_hint',
        },
      ],
    },
    zoryana_path_hint: {
      id: 'zoryana_path_hint',
      speaker: 'Зоряна',
      text: 'Купи в мене ключ-карту від головного люка, або пошукай вентиляційну решітку за сміттєвим баком у східній стіні. Тільки обережно: боти на підпалубі стріляють без попередження.',
      choices: [{ text: 'Дякую за інформацію.' }],
    },
    zoryana_decrypt_drive: {
      id: 'zoryana_decrypt_drive',
      speaker: 'Зоряна',
      text: 'Ого! Корпоративне шифрування 512-біт... Я можу зламати захист моїм дешифратором, але Нестор у підпалубі знає прямий ключ протоколу. Хоча зачекай... (клацає деком). Готово! Докази відкриті. Тепер це найгарячіший компромат на станції.',
      choices: [
        {
          text: 'Дякую, Зоряно. Це переверне всю станцію.',
          action: (state) => {
            state.quests.evidenceDecrypted = true;
            addItemToInventory(state.inventory, ITEMS.decrypted_evidence, 1);
            state.quests.stage = 'evidence_found';
          },
        },
      ],
    },

    // --------------------------------------------------
    // TECH NESTOR
    // --------------------------------------------------
    nestor_greeting: {
      id: 'nestor_greeting',
      speaker: 'Інженер Нестор',
      text: '(Здригається і стискає плазмовий різак). Не підходь! Ти від Корнієнка?! Вони послали зачистити свідка?!',
      choices: [
        {
          text: 'Спокійно. Я не з ліквідаторів. Мене прислав Тарас.',
          nextNodeId: 'nestor_calm',
        },
        {
          text: 'Розкажи правду: що сталося з оксигенератором?',
          nextNodeId: 'nestor_truth',
        },
        {
          text: '[Компроміс] Несторе, давай зітремо всі сліди в системі, щоб ти втік, а ми скинули борги.',
          nextNodeId: 'nestor_smuggler_ending',
          outcomeEnding: 'smugglers',
          condition: (state: GameWorldState) =>
            state.inventory.some((s) => s.item.id === 'decrypted_evidence' || s.item.id === 'encrypted_drive'),
          action: (state) => {
            applyQuestEndingOutcome(state, 'smugglers');
          },
        },
        {
          text: 'Тримайся тут, я повернуся.',
        },
      ],
    },
    nestor_calm: {
      id: 'nestor_calm',
      speaker: 'Інженер Нестор',
      text: 'Тарас... Слава богам, у докерів ще є совість. Мене підставили. Корпорація завантажила зловмисний мікрокод у клапани подачі й заблокувала фізичний байпас. Вони списали це на знос техніки, щоб учетверо підняти тариф кредитування.',
      choices: [
        {
          text: 'Як полагодити оксигенератор зараз?',
          nextNodeId: 'nestor_repair_steps',
        },
      ],
    },
    nestor_truth: {
      id: 'nestor_truth',
      speaker: 'Інженер Нестор',
      text: 'У серверній кімнаті за стіною стоїть резервний термінал Консорціуму. Там зберігається оригінальний лог з підписами керівництва. Але кімнату охороняє важкий дрон-автоматонець.',
      choices: [
        {
          text: 'Я знищу дрона і добуду диск.',
        },
      ],
    },
    nestor_repair_steps: {
      id: 'nestor_repair_steps',
      speaker: 'Інженер Нестор',
      text: 'Якщо вставити в головну консоль іонообмінний фільтр і залити кріо-холодоагент, ми відновимо тиск. Потім через плату логіки скинемо помилку суб-ядра НЕОС-9.',
      choices: [
        {
          text: 'Я зберу всі деталі.',
        },
      ],
    },
    nestor_smuggler_ending: {
      id: 'nestor_smuggler_ending',
      speaker: 'Інженер Нестор',
      text: 'Зтерти логи й перепрошити ідентифікатори?.. Так... якщо видалити телеметрію, Корпорація не зможе довести мою провину, а в хаосі перезавантаження сервера ми обнулимо боргові реєстри на кисень для всіх незалежних мешканців! Я завантажую вірус прямо зараз...',
      choices: [{ text: 'Завершити розмову.' }],
    },

    // --------------------------------------------------
    // NEOS-9 STATION AI
    // --------------------------------------------------
    neos_greeting: {
      id: 'neos_greeting',
      speaker: 'Суб-ядро «НЕОС-9»',
      text: '[СИНТЕТИЧНИЙ ГОЛОС]: Запит аутентифікації. Зафіксовано падіння концентрації O2 на 31.4%. Згідно з директивою №09-F, додаткова компресія активується тільки після погашення кредитної заборгованості сектора.',
      choices: [
        {
          text: 'Запустити аварійне відновлення рециркулятора (Потрібні: Фільтр, Холодоагент, Плата)',
          nextNodeId: 'neos_manual_repair',
          condition: (state: GameWorldState) =>
            state.inventory.some((s) => s.item.id === 'scrubber_filter') &&
            state.inventory.some((s) => s.item.id === 'cryo_coolant'),
        },
        {
          text: 'Який статус телеметрії та директиви 412?',
          nextNodeId: 'neos_telemetry_status',
        },
        {
          text: 'Закрити термінал.',
        },
      ],
    },
    neos_manual_repair: {
      id: 'neos_manual_repair',
      speaker: 'Суб-ядро «НЕОС-9»',
      text: '[КЛАПАНИ ВІДКРИТО]: Фільтраційний картридж встановлено. Кріогенне охолодження активне. Рівень кисню в системі стабілізується до нормативних 21%. Кредитний штраф за несанкціонований ремонт призупинено.',
      choices: [
        {
          text: 'Чудово! Станція знову дихає.',
          action: (state) => {
            state.quests.recyclerRepaired = true;
            state.player.oxygen = 100;
          },
        },
      ],
    },
    neos_telemetry_status: {
      id: 'neos_telemetry_status',
      speaker: 'Суб-ядро «НЕОС-9»',
      text: '[ДОСТУП ОБМЕЖЕНО]: Директива №412 класифікована як «Комерційна таємниця класу А». Дані збережено на сервері телеметрії в секторі 3-Схід.',
      choices: [{ text: 'Я знайду цей сервер.' }],
    },
  };
}
