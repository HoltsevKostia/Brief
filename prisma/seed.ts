import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function getRequiredEnv(name: "ADMIN_USERNAME" | "ADMIN_PASSWORD") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for seeding`);
  }
  return value;
}

async function main() {
  const username = getRequiredEnv("ADMIN_USERNAME");
  const password = getRequiredEnv("ADMIN_PASSWORD");
  const passwordHash = await hash(password, 12);

  await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  let brief = await prisma.briefConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!brief) {
    brief = await prisma.briefConfig.create({
      data: {
        title: "Бриф",
        description:
          "Бриф, як частина стадії збору інформації про проєкт чи продукт, надзвичайно важлива для взаєморозуміння команди із стейкхолдерами та/або кінцевими користувачами. Він дає змогу формалізувати та задокументувати бажання та потреби стейкхолдерів, та отримати розуміння про проєкт — його поточний стан чи потенціал його розробки. Детальні відповіді на питання брифу допоможуть краще зрозуміти проблематику бізнесу та відповідно оцінити складність, вартість та час роботи, необхідний на виконання проєкту. Бриф містить частину необов’язкових пунктів. Якщо на поточному етапі вони не є критичними чи пріоритетними, Ви можете пропускати їх. Пункти, позначені * , є обов’язковими до заповнення.",
      },
      select: { id: true },
    });
  } else {
    await prisma.briefConfig.update({
      where: { id: brief.id },
      data: {
        title: "Бриф",
        description:
          "Бриф, як частина стадії збору інформації про проєкт чи продукт, надзвичайно важлива для взаєморозуміння команди із стейкхолдерами та/або кінцевими користувачами. Він дає змогу формалізувати та задокументувати бажання та потреби стейкхолдерів, та отримати розуміння про проєкт — його поточний стан чи потенціал його розробки. Детальні відповіді на питання брифу допоможуть краще зрозуміти проблематику бізнесу та відповідно оцінити складність, вартість та час роботи, необхідний на виконання проєкту. Бриф містить частину необов’язкових пунктів. Якщо на поточному етапі вони не є критичними чи пріоритетними, Ви можете пропускати їх. Пункти, позначені * , є обов’язковими до заповнення.",
      },
    });
  }

  await prisma.briefQuestion.deleteMany({
    where: { briefConfigId: brief.id },
  });

  await prisma.briefQuestion.createMany({
    data: [
      {
        briefConfigId: brief.id,
        label: "Ім'я / Назва компанії",
        type: "text",
        required: true,
        sortOrder: 1,
        placeholder: "Наприклад: ТОВ \"Приклад\" або Ваше ім'я",
      },
      {
        briefConfigId: brief.id,
        label: "Контактна особа",
        type: "text",
        required: true,
        sortOrder: 2,
        placeholder: "Ім'я та прізвище",
      },
      {
        briefConfigId: brief.id,
        label: "Email",
        type: "email",
        required: true,
        sortOrder: 3,
        placeholder: "example@email.com",
      },
      {
        briefConfigId: brief.id,
        label: "Телефон / месенджер",
        type: "text",
        required: true,
        sortOrder: 4,
        placeholder: "+380...",
      },
      {
        briefConfigId: brief.id,
        label: "Час доступності для комунікації",
        type: "text",
        required: false,
        sortOrder: 5,
        placeholder: "Наприклад: будні 10:00–18:00",
      },
      {
        briefConfigId: brief.id,
        label: "Ви",
        type: "singleSelect",
        required: false,
        sortOrder: 6,
        placeholder: null,
        optionsJson: ["Власник бізнесу", "Представник компанії", "Стартап", "Інвестор", "Інше"],
      },
      {
        briefConfigId: brief.id,
        label: "Назва вашого продукту",
        type: "text",
        required: true,
        sortOrder: 7,
        placeholder: "Назва продукту",
      },
      {
        briefConfigId: brief.id,
        label: "Тип продукту",
        type: "singleSelect",
        required: true,
        sortOrder: 8,
        placeholder: null,
        optionsJson: ["Сайт", "Платформа", "CRM", "Маркетплейс", "SaaS", "Інше"],
      },
      {
        briefConfigId: brief.id,
        label: "Яку бізнес-проблему вирішує ваш продукт?",
        type: "textarea",
        required: true,
        sortOrder: 9,
        placeholder: "Опишіть проблему, яку вирішує продукт",
      },
      {
        briefConfigId: brief.id,
        label: "Чому зараз актуально його створювати чи оновлювати?",
        type: "textarea",
        required: false,
        sortOrder: 10,
        placeholder: "Опишіть причини актуальності",
      },
      {
        briefConfigId: brief.id,
        label: "Які цілі проєкту?",
        type: "textarea",
        required: true,
        sortOrder: 11,
        placeholder: "Опишіть основні цілі проєкту",
      },
      {
        briefConfigId: brief.id,
        label:
          "Чим ваш продукт відрізняється від існуючих рішень на ринку? Яку ключову цінність або перевагу отримує користувач, обираючи саме ваш продукт?",
        type: "textarea",
        required: true,
        sortOrder: 12,
        placeholder: "Опишіть унікальність та цінність продукту",
      },
      {
        briefConfigId: brief.id,
        label: "Які складники KPI мають змінитися?",
        type: "multiSelect",
        required: false,
        sortOrder: 13,
        placeholder: null,
        optionsJson: ["Збільшення продажів", "Збільшення конверсії", "Автоматизація процесів", "Зменшення витрат", "Інше"],
      },
      {
        briefConfigId: brief.id,
        label: "Як ви визначите, що проєкт успішний?",
        type: "textarea",
        required: false,
        sortOrder: 14,
        placeholder: "Опишіть критерії успіху",
      },
      {
        briefConfigId: brief.id,
        label: "Хто основний користувач?",
        type: "text",
        required: true,
        sortOrder: 15,
        placeholder: "Опишіть основного користувача",
      },
      {
        briefConfigId: brief.id,
        label: "Географія",
        type: "text",
        required: false,
        sortOrder: 16,
        placeholder: "Країна, регіон, ринок",
      },
      {
        briefConfigId: brief.id,
        label: "Вік",
        type: "text",
        required: false,
        sortOrder: 17,
        placeholder: "Наприклад: 18–35",
      },
      {
        briefConfigId: brief.id,
        label: "Основні потреби",
        type: "textarea",
        required: false,
        sortOrder: 18,
        placeholder: "Що важливо для користувача",
      },
      {
        briefConfigId: brief.id,
        label: "Основні проблеми",
        type: "textarea",
        required: false,
        sortOrder: 19,
        placeholder: "Які труднощі має користувач",
      },
      {
        briefConfigId: brief.id,
        label: "Який ключовий сценарій використання продукту?",
        type: "textarea",
        required: false,
        sortOrder: 20,
        placeholder: "Опишіть типовий сценарій використання",
      },
      {
        briefConfigId: brief.id,
        label: "Оберіть необхідні модулі",
        type: "multiSelect",
        required: false,
        sortOrder: 21,
        placeholder: null,
        optionsJson: [
          "Авторизація / реєстрація",
          "Кабінет користувача",
          "Платіжна система",
          "Адмін-панель",
          "API інтеграції",
          "CRM модуль",
          "Аналітика",
          "Чат / повідомлення",
          "Мультимовність",
          "Інше",
        ],
      },
      {
        briefConfigId: brief.id,
        label: "Опишіть специфічні функції, які є критичними",
        type: "textarea",
        required: true,
        sortOrder: 22,
        placeholder: "Опишіть критичні функції",
      },
      {
        briefConfigId: brief.id,
        label: "Очікувана кількість користувачів",
        type: "number",
        required: false,
        sortOrder: 23,
        placeholder: "Наприклад: 1000",
      },
      {
        briefConfigId: brief.id,
        label: "Чи є вимоги до швидкодії?",
        type: "textarea",
        required: false,
        sortOrder: 24,
        placeholder: "Опишіть вимоги до швидкодії",
      },
      {
        briefConfigId: brief.id,
        label: "Чи є вимоги до безпеки?",
        type: "textarea",
        required: false,
        sortOrder: 25,
        placeholder: "Опишіть вимоги до безпеки",
      },
      {
        briefConfigId: brief.id,
        label: "Чи потрібна відповідність стандартам (GDPR, ISO тощо)?",
        type: "textarea",
        required: false,
        sortOrder: 26,
        placeholder: "Вкажіть потрібні стандарти",
      },
      {
        briefConfigId: brief.id,
        label: "Чи є вимоги до масштабування?",
        type: "textarea",
        required: false,
        sortOrder: 27,
        placeholder: "Опишіть вимоги до масштабування",
      },
      {
        briefConfigId: brief.id,
        label: "Чи планується мобільна адаптація?",
        type: "singleSelect",
        required: false,
        sortOrder: 28,
        placeholder: null,
        optionsJson: ["Так", "Ні", "Поки невідомо"],
      },
      {
        briefConfigId: brief.id,
        label: "Інші специфічні вимоги",
        type: "textarea",
        required: false,
        sortOrder: 29,
        placeholder: "Додаткові вимоги",
      },
      {
        briefConfigId: brief.id,
        label: "Бюджет",
        type: "number",
        required: true,
        sortOrder: 30,
        placeholder: "Наприклад: 5000",
      },
      {
        briefConfigId: brief.id,
        label: "Кінцевий дедлайн",
        type: "text",
        required: true,
        sortOrder: 31,
        placeholder: "Наприклад: 30.06.2026",
      },
      {
        briefConfigId: brief.id,
        label: "Чи є обмеження по технологіях?",
        type: "textarea",
        required: false,
        sortOrder: 32,
        placeholder: "Опишіть обмеження по технологіях",
      },
      {
        briefConfigId: brief.id,
        label: "Чи є юридичні або регуляторні вимоги до продукту?",
        type: "textarea",
        required: false,
        sortOrder: 33,
        placeholder: "Опишіть вимоги",
      },
      {
        briefConfigId: brief.id,
        label: "Чи є у вас готовий текстовий та графічний контент?",
        type: "singleSelect",
        required: false,
        sortOrder: 34,
        placeholder: null,
        optionsJson: ["Так", "Частково", "Ні, потрібно створювати"],
      },
      {
        briefConfigId: brief.id,
        label: "Хто буде відповідальний з вашого боку за надання матеріалів та погодження?",
        type: "text",
        required: false,
        sortOrder: 35,
        placeholder: "Ім'я / роль / контакт",
      },
      {
        briefConfigId: brief.id,
        label: "Чи є у вас внутрішня технічна команда?",
        type: "singleSelect",
        required: false,
        sortOrder: 36,
        placeholder: null,
        optionsJson: ["Так", "Ні", "Частково"],
      },
      {
        briefConfigId: brief.id,
        label: "Чи планується масштабування продукту після запуску?",
        type: "singleSelect",
        required: false,
        sortOrder: 37,
        placeholder: null,
        optionsJson: ["Так", "Ні", "Поки невідомо"],
      },
      {
        briefConfigId: brief.id,
        label: "Чи потрібна технічна підтримка після запуску?",
        type: "singleSelect",
        required: false,
        sortOrder: 38,
        placeholder: null,
        optionsJson: ["Так", "Ні", "Ще не визначено"],
      },
      {
        briefConfigId: brief.id,
        label: "Термін підтримки",
        type: "text",
        required: false,
        sortOrder: 39,
        placeholder: "Наприклад: 3 місяці",
      },
      {
        briefConfigId: brief.id,
        label: "Чи планується SEO?",
        type: "singleSelect",
        required: false,
        sortOrder: 40,
        placeholder: null,
        optionsJson: ["Так", "Ні", "Ще не визначено"],
      },
      {
        briefConfigId: brief.id,
        label: "Чи потрібен маркетинг?",
        type: "singleSelect",
        required: false,
        sortOrder: 41,
        placeholder: null,
        optionsJson: ["Так", "Ні", "Ще не визначено"],
      },
      {
        briefConfigId: brief.id,
        label: "Логотип",
        type: "text",
        required: false,
        sortOrder: 42,
        placeholder: "Посилання / опис / наявність",
      },
      {
        briefConfigId: brief.id,
        label: "Брендбук",
        type: "text",
        required: false,
        sortOrder: 43,
        placeholder: "Посилання / опис / наявність",
      },
      {
        briefConfigId: brief.id,
        label: "Приклади",
        type: "textarea",
        required: false,
        sortOrder: 44,
        placeholder: "Наведіть приклади або посилання",
      },
      {
        briefConfigId: brief.id,
        label: "Бажаний стиль",
        type: "singleSelect",
        required: false,
        sortOrder: 45,
        placeholder: null,
        optionsJson: ["Мінімалістичний", "Корпоративний", "Креативний", "Технологічний", "Преміальний", "Інше"],
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

