import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useRestoreStore = defineStore('restoreWallet', () => {
  const mnemonic = ref('');
  const password = ref('');
  const phoneNumber = ref('');  // ✅ Add phoneNumber state

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
