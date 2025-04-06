<template>
  <div class="sms-authentication">
    <h3 class="sms-authentication__title">Verify Your Identity</h3>
    <p class="sms-authentication__description">
      Enter the OTP sent to <b>{{ phoneNumber }}</b>.
    </p>

    <div class="sms-authentication__form">
      <input
        v-model="otp"
        type="text"
        class="sms-authentication__input"
        placeholder="Paste Encrypted OTP from SMS"
        @keyup.enter="verifyOtp"
      />
      <button
        class="sms-authentication__button"
        @click="verifyOtp"
        :disabled="!otp.length || isInitializing"
      >
        Enter
      </button>
    </div>

    <p class="sms-authentication__label">
      Didn't receive the code?
      <a @click="resendOtp" class="sms-authentication__resend">Resend OTP</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useRestoreStore } from '@/ui/onboard/restore-wallet/store';
import { routes } from '../restore-wallet/routes';
import { onboardInitializeWallets } from '@/libs/utils/initialize-wallet';
import CryptoJS from 'crypto-js'; // AES decryption

const AES_KEY = CryptoJS.enc.Utf8.parse('+W6N2IqN0uCIphbe'); // 

const router = useRouter();
const store = useRestoreStore();

const phoneNumber = ref('');
const otp = ref('');
const isInitializing = ref(false);

onMounted(() => {
  phoneNumber.value = store.phoneNumber;
  if (!phoneNumber.value) {
    alert("Phone number missing! Redirecting...");
    router.push({ name: 'restore-wallet-enter-phone' });
  }
  if (!store.mnemonic || !store.password) {
    alert("Missing mnemonic or password. Redirecting to start...");
    router.push({ name: 'restore-wallet-start' });
  }
});

const isButtonDisabled = computed(() => {
  return !otp.value || isInitializing.value;
});

function decryptOtp(encryptedOtp: string): string | null {
  try {
    const encryptedData = CryptoJS.enc.Base64.parse(encryptedOtp);
    const iv = CryptoJS.lib.WordArray.create(encryptedData.words.slice(0, 4)); // 16 bytes = 4 words
    const ciphertext = CryptoJS.lib.WordArray.create(encryptedData.words.slice(4));

    const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, AES_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error("Decryption error:", err);
    return null;
  }
}


async function verifyOtp() {
  if (!otp.value.trim()) {
    alert("Please paste the encrypted OTP.");
    return;
  }

  isInitializing.value = true;

  const decryptedOtp = decryptOtp(otp.value.trim());
  if (!decryptedOtp) {
    alert("Decryption failed. Please check the OTP or try again.");
    isInitializing.value = false;
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phoneNumber.value,
        otp: decryptedOtp,
      })
    });

    const data = await response.json();
    if (data.success) {
      alert("OTP Verified! Wallet initializing...");

      try {
        await onboardInitializeWallets(store.mnemonic, store.password);
      } catch (err) {
        console.error("Wallet init failed:", err);
        alert("Failed to initialize wallet.");
        isInitializing.value = false;
        return;
      }

      isInitializing.value = false;
      router.push({ name: routes.walletReady.name });
    } else {
      alert(`Verification failed: ${data.message}`);
      isInitializing.value = false;
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    alert("Verification request failed. Check console.");
    isInitializing.value = false;
  }
}

async function resendOtp() {
  if (!phoneNumber.value) {
    alert("No phone number to resend to.");
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phoneNumber.value })
    });
    const data = await response.json();
    if (data.success) {
      alert("OTP resent!");
    } else {
      alert(`Resend error: ${data.message}`);
    }
  } catch (error) {
    console.error("Resend error:", error);
    alert("Failed to resend OTP.");
  }
}
</script>

<style lang="less">
@import '@action/styles/theme.less';

.sms-authentication {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  padding: 48px;
  max-width: 400px;
  margin: auto;
  text-align: center;

  &__title {
    font-weight: 700;
    font-size: 28px;
    color: @primaryLabel;
    margin-bottom: 12px;
  }

  &__description {
    font-size: 16px;
    color: @secondaryLabel;
    margin-bottom: 24px;
    line-height: 1.5;
  }

  &__form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__input {
    width: 100%;
    padding: 14px;
    font-size: 18px;
    border: 1px solid @border;
    border-radius: 10px;
    text-align: center;
    background: #fff;
    box-shadow: none;
  }

  &__button {
    width: 100%;
    padding: 16px;
    font-size: 18px;
    background-color: @primaryButton;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.3s;
    box-shadow: none;

    &:disabled {
      background-color: @disabledButton;
      cursor: not-allowed;
    }
  }

  &__label {
    font-size: 14px;
    color: @secondaryLabel;
    margin-top: 16px;
  }

  &__resend {
    color: @primaryButton;
    font-weight: bold;
    cursor: pointer;
    font-size: 14px;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
