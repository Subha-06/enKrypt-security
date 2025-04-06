import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useOnboardStore = defineStore('restoreWallet', () => {
  const mnemonic = ref('');
  const password = ref('');
  const phoneNumber = ref('');

  const setMnemonic = (_mnemonic: string) => {
    mnemonic.value = _mnemonic;
  };
  const setPassword = (_password: string) => {
    password.value = _password;
  };

  const setPhoneNumber = (_phone: string) => {  // ✅ Add a setter function for phoneNumber
    phoneNumber.value = _phone;
  };

  return { mnemonic, password, phoneNumber, setMnemonic, setPassword, setPhoneNumber };
});
