<template>
    <div class="sms-authentication">
      <h3 class="sms-authentication__title">Verify Your Identity</h3>
      <p class="sms-authentication__description">
        Enter the 6-digit code sent to <b>{{ phoneNumber }}</b>.
      </p>
  
      <div id="recaptcha-container"></div>
  
      <div class="sms-authentication__form">
        <input
          v-model="otp"
          type="text"
          class="sms-authentication__input"
          placeholder="Enter OTP"
          @keyup.enter="verifyOtp"
        />
        <button class="sms-authentication__button" @click="verifyOtp" :disabled="otp.length !== 6">
          Enter
        </button>
      </div>
  
      <p class="sms-authentication__label">
        Didn't receive the code? <a @click="sendOtp" class="sms-authentication__resend">Resend OTP</a>
      </p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { auth } from '@/configs/firebase-config';
  import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
  import { useRestoreStore } from '@/ui/onboard/restore-wallet/store';
  
  // ✅ Declare 'recaptchaVerifier' globally
  declare global {
    interface Window {
      recaptchaVerifier: RecaptchaVerifier | null;
    }
  }
  
  const router = useRouter();
  const store = useRestoreStore();
  const phoneNumber = ref('');
  const otp = ref('');
  let confirmationResult: ConfirmationResult | null = null;
  
  const sendOtp = async () => {
    if (!phoneNumber.value) {
      alert("Phone number missing!");
      return;
    }
  
    try {
      auth.settings.appVerificationDisabledForTesting = false;
  
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
  
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: "invisible"
      });
  
      confirmationResult = await signInWithPhoneNumber(auth, phoneNumber.value, window.recaptchaVerifier);
      alert("OTP Sent Successfully!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP. Check console logs.");
    }
  };
  
  const verifyOtp = async () => {
    if (!otp.value || otp.value.length !== 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }
  
    if (!confirmationResult) {
      alert("No OTP confirmation found. Please resend the OTP.");
      return;
    }
  
    try {
      const credential = await confirmationResult.confirm(otp.value);
      if (credential.user) {
        alert("SMS Authentication Successful!");
        router.push({ name: 'restore-wallet-walletReady' });
      }
    } catch (error) {
      console.error("Invalid OTP:", error);
      alert("Invalid OTP. Try again.");
    }
  };
  
  onMounted(() => {
    phoneNumber.value = store.phoneNumber;
    if (!phoneNumber.value) {
      alert("Phone number missing! Redirecting...");
      router.push({ name: 'restore-wallet-enter-phone' });
    } else {
      sendOtp();
    }
  });
  </script>
  
  <style lang="less">
  @import '@action/styles/theme.less';
  
  .sms-authentication {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    padding: 40px;
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    margin: auto;
    text-align: center;
  
    &__title {
      font-weight: 700;
      font-size: 24px;
      color: @primaryLabel;
      margin-bottom: 10px;
    }
  
    &__description {
      font-size: 16px;
      color: @secondaryLabel;
      margin-bottom: 20px;
    }
  
    &__form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  
    &__input {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      border: 1px solid @border;
      border-radius: 5px;
      text-align: center;
    }
  
    &__button {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      background-color: @primaryButton;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 600;
      
      &:disabled {
        background-color: @disabledButton;
        cursor: not-allowed;
      }
    }
  
    &__label {
      font-size: 14px;
      color: @secondaryLabel;
      margin-top: 10px;
    }
  
    &__resend {
      color: @primaryButton;
      font-weight: bold;
      cursor: pointer;
    }
  }
  </style>
  