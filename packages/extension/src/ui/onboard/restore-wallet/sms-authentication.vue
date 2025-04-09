<template>
  <div class="sms-authentication">
    <h3 class="sms-authentication__title">Verify Your Identity</h3>
    <p class="sms-authentication__description">
      Enter the 6-digit code sent to <b>{{ phoneNumber }}</b>.
    </p>

    <!-- Countdown Timer Display -->
    <div class="sms-authentication__timer">
      Time remaining: {{ formattedCountdown }}
    </div>

    <div class="sms-authentication__form">
      <input
        v-model="otp"
        type="text"
        class="sms-authentication__input"
        placeholder="Enter OTP"
        @keyup.enter="verifyOtp"
      />
      <button
        class="sms-authentication__button"
        @click="verifyOtp"
        :disabled="otp.length !== 6 || isInitializing"
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useRestoreStore } from '@/ui/onboard/restore-wallet/store';
import { routes } from '../restore-wallet/routes';
import { onboardInitializeWallets } from '@/libs/utils/initialize-wallet'; 

const router = useRouter();
const store = useRestoreStore();

const phoneNumber = ref('');
const otp = ref('');
const isInitializing = ref(false);

// Countdown timer: 300 seconds (5 minutes)
const countdown = ref(300);
const formattedCountdown = computed(() => {
  const minutes = Math.floor(countdown.value / 60).toString().padStart(2, '0');
  const seconds = (countdown.value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
});

let timerInterval: number;

function startTimer() {
  clearInterval(timerInterval);
  countdown.value = 300;
  timerInterval = window.setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1;
    } else {
      clearInterval(timerInterval);
    }
  }, 1000);
}

onMounted(() => {
  phoneNumber.value = localStorage.getItem('user_phone_number') || '';
  if (!phoneNumber.value) {
    alert("Phone number missing! Redirecting...");
    router.push({ name: 'restore-wallet-enter-phone' });
  }
  if (!store.mnemonic || !store.password) {
    alert("Missing mnemonic or password. Redirecting to start...");
    router.push({ name: 'restore-wallet-start' });
  }
  startTimer();
});

onUnmounted(() => {
  clearInterval(timerInterval);
});

async function verifyOtp() {
  if (otp.value.length !== 6) {
    alert("Please enter a valid 6-digit OTP.");
    return;
  }

  isInitializing.value = true;

  try {
    const response = await fetch('http://localhost:3000/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phoneNumber.value,
        otp: otp.value
      })
    });

    const data = await response.json();
    if (data.success) {
      alert("SMS Authentication Successful!");
      try {
        await onboardInitializeWallets(store.mnemonic, store.password);
      } catch (err) {
        console.error("Error initializing wallet:", err);
        alert("Failed to initialize wallet. Check console for details.");
        isInitializing.value = false;
        return;
      }
      isInitializing.value = false;
      router.push({ name: routes.walletReady.name });
    } else {
      alert(`Invalid OTP: ${data.message}`);
      isInitializing.value = false;
    }
  } catch (error) {
    console.error("Network error verifying OTP:", error);
    alert("Failed to verify OTP. Check console for details.");
    isInitializing.value = false;
  }
}

async function resendOtp() {
  if (!phoneNumber.value) {
    alert("No phone number to resend to. Please go back.");
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
      alert("OTP resent successfully!");
      startTimer(); // Reset the timer when OTP is resent
    } else {
      alert(`Error resending OTP: ${data.message}`);
    }
  } catch (error) {
    console.error("Network error resending OTP:", error);
    alert("Failed to resend OTP. Check console for details.");
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

  &__timer {
    font-size: 16px;
    color: @primaryLabel;
    margin-bottom: 16px;
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
