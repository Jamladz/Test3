import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        adError: "Action failed",
        adNotReady: "Sponsored content not ready",
        withdraw: "Withdraw",
        withdrawMin: "Min 4 TON required.",
        navHome: "Home",
        navEarn: "Earn",
        navPromote: "Promote",
        navFriends: "Friends",
        statistics: "Statistics",
        pointsBalance: "Points Balance",
        completedTasks: "Tasks",
        rnkTopLeaders: "Top Leaders",
        lvlNewbie: "NEWBIE",
        weeklyWithdrawals: "Weekly Withdrawals",
        sponsorTasks: "Partner Placements",
        watch: "Watch",
        claim: "Claim",
        exchangeInfo: "10,000 XP = 1 TON",
        internalWallet: "Internal Wallet",
        convert: "Convert",
        tonBalance: "TON Balance",
      }
    },
    ar: {
      translation: {
        adError: "فشلت العملية",
        adNotReady: "المحتوى الممول غير جاهز",
        withdraw: "سحب",
        withdrawMin: "الحد الأدنى 4 TON",
        navHome: "الرئيسية",
        navEarn: "المهام",
        navPromote: "إعلانات",
        navFriends: "الأصدقاء",
        statistics: "الإحصائيات",
        pointsBalance: "رصيد النقاط",
        completedTasks: "المهام",
        rnkTopLeaders: "أفضل القادة",
        lvlNewbie: "مبتدئ",
        weeklyWithdrawals: "سحوبات الأسبوع",
        sponsorTasks: "عروض الشركاء",
        watch: "مشاهدة",
        claim: "جمع",
        exchangeInfo: "10,000 XP = 1 TON",
        internalWallet: "المحفظة الداخلية",
        convert: "تحويل",
        tonBalance: "رصيد TON",
      }
    },
    ru: {
      translation: {
        adError: "Ошибка",
        adNotReady: "Реклама не готова",
        withdraw: "Вывод",
        withdrawMin: "Мин. 4 TON",
        navHome: "Главная",
        navEarn: "Заработать",
        navPromote: "Реклама",
        navFriends: "Друзья",
        statistics: "Статистика",
        pointsBalance: "Баланс очков",
        completedTasks: "Задания",
        rnkTopLeaders: "Топ Лидеры",
        lvlNewbie: "НОВИЧОК",
        weeklyWithdrawals: "Выводы недели",
        sponsorTasks: "Задания Партнеров",
        watch: "Смотреть",
        claim: "Забрать",
        exchangeInfo: "10,000 XP = 1 TON",
        internalWallet: "Внутренний кошелек",
        convert: "Обменять",
        tonBalance: "Баланс TON",
      }
    }
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
