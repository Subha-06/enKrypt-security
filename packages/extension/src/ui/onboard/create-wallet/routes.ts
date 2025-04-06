import PickPassword from './pick-password.vue';
import TypePassword from './type-password.vue';
import RecoveryPhrase from './recovery-phrase.vue';
import CheckPhrase from './double-check-phrase.vue';
import EnterPhoneNumber from './enter-phone-number.vue';
import SmsAuthentication from './sms-authentication.vue'; 
import WalletReady from './wallet-ready.vue';
import UserAnalytics from '../user-analytics.vue';
import { RouteRecordRaw } from 'vue-router';
export const routes = {
  pickPassword: {
    path: 'pick-password',
    name: 'pick-password',
    component: PickPassword,
  },
  typePassword: {
    path: 'type-password',
    name: 'type-password',
    component: TypePassword,
  },
  recoveryPhrase: {
    path: 'recovery-phrase',
    name: 'recovery-phrase',
    component: RecoveryPhrase,
  },
  checkPhrase: {
    path: 'check-phrase',
    name: 'check-phrase',
    component: CheckPhrase,
  },
  enterPhone: {
    path: 'enter-phone-number',
    name: 'enter-phone-number', // ✅ match this exactly
    component: EnterPhoneNumber,
  }, 
  smsAuthentication: {  // ✅ NEW ROUTE ADDED
    path: 'sms-authentication',
    name: 'sms-authentication',
    component: SmsAuthentication,
  },
  userAnalytics: {
    path: 'user-analytics',
    name: 'user-analytics',
    component: UserAnalytics,
  },
  walletReady: {
    path: 'wallet-ready',
    name: 'wallet-ready',
    component: WalletReady,
  },
};
export const namespace = 'create-wallet';

export default (): RouteRecordRaw[] => {
  return Object.values(routes).map(route => {
    route.path = `/${namespace}/${route.path}`;
    route.name = `${namespace}-${String(route.name)}`;
    return route;
  });
};
