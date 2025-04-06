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
        :disabled="otp.length !== 6"
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
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOnboardStore } from './store';
import { routes } from '../create-wallet/routes';
import { onboardInitializeWallets } from '@/libs/utils/initialize-wallet';

const router = useRouter();
const store = useOnboardStore();

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
  phoneNumber.value = store.phoneNumber;
  if (!phoneNumber.value) {
    alert("Phone number missing! Redirecting...");
    router.push({ name: 'create-wallet-enter-phone-number' });
  }
  if (!store.password) {
    alert("Missing password. Redirecting to start...");
    router.push({ name: 'create-wallet-start' });
  }
  startTimer();
});

onUnmounted(() => {
  clearInterval(timerInterval);
});

const isButtonDisabled = computed(() => {
  return !otp.value || isInitializing.value;
});

async function verifyOtp() {
  if (otp.value.length !== 6) {
    alert("Please enter a valid 6-digit OTP.");
    return;
  }
  
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
      alert("OTP Verified! Wallet initializing...");
      try {
        router.push({ name: 'create-wallet-recovery-phrase' });
      } catch (err) {
        console.error("Wallet init failed:", err);
        alert("Failed to initialize wallet.");
        isInitializing.value = false;
        return;
      }
      isInitializing.value = false;
      router.push({ name: 'create-wallet-recovery-phrase' });
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
      startTimer(); // Reset the timer upon resending OTP
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
