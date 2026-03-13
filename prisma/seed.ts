import { PrismaClient, QuestionType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function getRequiredEnv(name: "ADMIN_USERNAME" | "ADMIN_PASSWORD") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for seeding`);
  }
  return value;
}

type SeedQuestion = {
  label: string;
  type: QuestionType;
  required: boolean;
  placeholder?: string;
  optionsJson?: string[];
};

type SeedSection = {
  title: string;
  description?: string;
  questions: SeedQuestion[];
};

const BRIEF_TITLE = "Бриф";
const BRIEF_DESCRIPTION =
  "Бриф, як частина стадії збору інформації про проєкт чи продукт, надзвичайно важлива для взаєморозуміння команди із стейкхолдерами та/або кінцевими користувачами. Він дає змогу формалізувати та задокументувати бажання та потреби стейкхолдерів, та отримати розуміння про проєкт — його поточний стан чи потенціал його розробки. Детальні відповіді на питання брифу допоможуть краще зрозуміти проблематику бізнесу та відповідно оцінити складність, вартість та час роботи, необхідний на виконання проєкту. Бриф містить частину необов’язкових пунктів. Якщо на поточному етапі вони не є критичними чи пріоритетними, Ви можете пропускати їх. Пункти, позначені * , є обов’язковими до заповнення.";

const sections: SeedSection[] = [
  {
    title: "Контактна інформація",
    questions: [
      { label: "Ім'я / Назва компанії", type: "text", required: true, placeholder: "Наприклад: ТОВ \"Приклад\" або Ваше ім'я" },
      { label: "Контактна особа", type: "text", required: true, placeholder: "Ім'я та прізвище" },
      { label: "Email", type: "email", required: true, placeholder: "example@email.com" },
      { label: "Телефон / месенджер", type: "text", required: true, placeholder: "+380..." },
      { label: "Час доступності для комунікації", type: "text", required: false, placeholder: "Наприклад: будні 10:00–18:00" },
      {
        label: "Ви",
        type: "singleSelect",
        required: false,
        optionsJson: ["Власник бізнесу", "Представник компанії", "Стартап", "Інвестор", "Інше"],
      },
    ],
  },
  {
    title: "Інформація про продукт",
    questions: [
      { label: "Назва вашого продукту", type: "text", required: true, placeholder: "Назва продукту" },
      {
        label: "Тип продукту",
        type: "singleSelect",
        required: true,
        optionsJson: ["Сайт", "Платформа", "CRM", "Маркетплейс", "SaaS", "Інше"],
      },
      {
        label: "Яку бізнес-проблему вирішує ваш продукт?",
        type: "textarea",
        required: true,
        placeholder: "Опишіть проблему, яку вирішує продукт",
      },
      {
        label: "Чому зараз актуально його створювати чи оновлювати?",
        type: "textarea",
        required: false,
        placeholder: "Опишіть причини актуальності",
      },
      {
        label: "Які цілі проєкту?",
        type: "textarea",
        required: true,
        placeholder: "Опишіть основні цілі проєкту",
      },
      {
        label:
          "Чим ваш продукт відрізняється від існуючих рішень на ринку? Яку ключову цінність або перевагу отримує користувач, обираючи саме ваш продукт?",
        type: "textarea",
        required: true,
        placeholder: "Опишіть унікальність та цінність продукту",
      },
    ],
  },
  {
    title: "Бізнес-цілі та цінність",
    questions: [
      {
        label: "Які складники KPI мають змінитися?",
        type: "multiSelect",
        required: false,
        optionsJson: ["Збільшення продажів", "Збільшення конверсії", "Автоматизація процесів", "Зменшення витрат", "Інше"],
      },
      {
        label: "Як ви визначите, що проєкт успішний?",
        type: "textarea",
        required: false,
        placeholder: "Опишіть критерії успіху",
      },
    ],
  },
  {
    title: "Цільова аудиторія",
    questions: [
      { label: "Хто основний користувач?", type: "text", required: true, placeholder: "Опишіть основного користувача" },
      { label: "Географія", type: "text", required: false, placeholder: "Країна, регіон, ринок" },
      { label: "Вік", type: "text", required: false, placeholder: "Наприклад: 18–35" },
      { label: "Основні потреби", type: "textarea", required: false, placeholder: "Що важливо для користувача" },
      { label: "Основні проблеми", type: "textarea", required: false, placeholder: "Які труднощі має користувач" },
      {
        label: "Який ключовий сценарій використання продукту?",
        type: "textarea",
        required: false,
        placeholder: "Опишіть типовий сценарій використання",
      },
    ],
  },
  {
    title: "Функціонал продукту",
    questions: [
      {
        label: "Оберіть необхідні модулі",
        type: "multiSelect",
        required: false,
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
        label: "Опишіть специфічні функції, які є критичними",
        type: "textarea",
        required: true,
        placeholder: "Опишіть критичні функції",
      },
    ],
  },
  {
    title: "Технічні вимоги",
    questions: [
      { label: "Очікувана кількість користувачів", type: "number", required: false, placeholder: "Наприклад: 1000" },
      { label: "Чи є вимоги до швидкодії?", type: "textarea", required: false, placeholder: "Опишіть вимоги до швидкодії" },
      { label: "Чи є вимоги до безпеки?", type: "textarea", required: false, placeholder: "Опишіть вимоги до безпеки" },
      {
        label: "Чи потрібна відповідність стандартам (GDPR, ISO тощо)?",
        type: "textarea",
        required: false,
        placeholder: "Вкажіть потрібні стандарти",
      },
      { label: "Чи є вимоги до масштабування?", type: "textarea", required: false, placeholder: "Опишіть вимоги до масштабування" },
      {
        label: "Чи планується мобільна адаптація?",
        type: "singleSelect",
        required: false,
        optionsJson: ["Так", "Ні", "Поки невідомо"],
      },
      { label: "Інші специфічні вимоги", type: "textarea", required: false, placeholder: "Додаткові вимоги" },
    ],
  },
  {
    title: "Бюджет, терміни та обмеження",
    questions: [
      { label: "Бюджет", type: "number", required: true, placeholder: "Наприклад: 5000" },
      { label: "Кінцевий дедлайн", type: "text", required: true, placeholder: "Наприклад: 30.06.2026" },
      {
        label: "Чи є обмеження по технологіях?",
        type: "textarea",
        required: false,
        placeholder: "Опишіть обмеження по технологіях",
      },
      {
        label: "Чи є юридичні або регуляторні вимоги до продукту?",
        type: "textarea",
        required: false,
        placeholder: "Опишіть вимоги",
      },
    ],
  },
  {
    title: "Контент, підтримка та розвиток",
    questions: [
      {
        label: "Чи є у вас готовий текстовий та графічний контент?",
        type: "singleSelect",
        required: false,
        optionsJson: ["Так", "Частково", "Ні, потрібно створювати"],
      },
      {
        label: "Хто буде відповідальний з вашого боку за надання матеріалів та погодження?",
        type: "text",
        required: false,
        placeholder: "Ім'я / роль / контакт",
      },
      {
        label: "Чи є у вас внутрішня технічна команда?",
        type: "singleSelect",
        required: false,
        optionsJson: ["Так", "Ні", "Частково"],
      },
      {
        label: "Чи планується масштабування продукту після запуску?",
        type: "singleSelect",
        required: false,
        optionsJson: ["Так", "Ні", "Поки невідомо"],
      },
      {
        label: "Чи потрібна технічна підтримка після запуску?",
        type: "singleSelect",
        required: false,
        optionsJson: ["Так", "Ні", "Ще не визначено"],
      },
      { label: "Термін підтримки", type: "text", required: false, placeholder: "Наприклад: 3 місяці" },
      { label: "Чи планується SEO?", type: "singleSelect", required: false, optionsJson: ["Так", "Ні", "Ще не визначено"] },
      { label: "Чи потрібен маркетинг?", type: "singleSelect", required: false, optionsJson: ["Так", "Ні", "Ще не визначено"] },
    ],
  },
  {
    title: "Дизайн та приклади",
    questions: [
      { label: "Логотип", type: "text", required: false, placeholder: "Посилання / опис / наявність" },
      { label: "Брендбук", type: "text", required: false, placeholder: "Посилання / опис / наявність" },
      { label: "Приклади", type: "textarea", required: false, placeholder: "Наведіть приклади або посилання" },
      {
        label: "Бажаний стиль",
        type: "singleSelect",
        required: false,
        optionsJson: ["Мінімалістичний", "Корпоративний", "Креативний", "Технологічний", "Преміальний", "Інше"],
      },
    ],
  },
];

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
        title: BRIEF_TITLE,
        description: BRIEF_DESCRIPTION,
      },
      select: { id: true },
    });
  } else {
    await prisma.briefConfig.update({
      where: { id: brief.id },
      data: {
        title: BRIEF_TITLE,
        description: BRIEF_DESCRIPTION,
      },
    });
  }

  await prisma.briefQuestion.deleteMany({
    where: { briefConfigId: brief.id },
  });
  await prisma.briefSection.deleteMany({
    where: { briefConfigId: brief.id },
  });

  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex];
    const createdSection = await prisma.briefSection.create({
      data: {
        briefConfigId: brief.id,
        title: section.title,
        description: section.description ?? null,
        sortOrder: sectionIndex + 1,
      },
      select: { id: true },
    });

    await prisma.briefQuestion.createMany({
      data: section.questions.map((question, questionIndex) => ({
        briefConfigId: brief.id,
        briefSectionId: createdSection.id,
        label: question.label,
        type: question.type,
        required: question.required,
        sortOrder: questionIndex + 1,
        placeholder: question.placeholder ?? null,
        optionsJson: question.optionsJson,
      })),
    });
  }
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
