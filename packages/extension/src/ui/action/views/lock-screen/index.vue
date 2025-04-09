<template>
  <div class="lock-screen__container">
    <!-- Password Input Phase -->
    <div v-if="!isOtpPhase && !isForgot && !isUnlocking" class="lock-screen__wrap">
      <logo-big class="lock-screen__logo" />
      <h4>Unlock with password</h4>
      <lock-screen-password-input
        :is-error="isError"
        :value="password"
        @update:value="passwordChanged"
        @keyup.enter="unlockAction"
      />
      <base-button
        title="Unlock"
        :click="unlockAction"
        :disabled="isDisabled"
      />
    </div>

    <!-- OTP Verification Phase -->
    <div v-if="isOtpPhase" class="lock-screen__otp">
      <h4>Verify with SMS OTP</h4>
      <input
        type="text"
        v-model="otp"
        @keyup.enter="verifyOtpAction"
        placeholder="Enter OTP"
      />
      <base-button title="Verify OTP" :click="verifyOtpAction" />
      <base-button title="Resend OTP" :click="sendOtpAction" />
      <p v-if="otpError" class="error-msg">
        Invalid OTP. Please try again.
      </p>
    </div>

    <!-- Unlocking animation -->
    <div v-show="isUnlocking" class="lock-screen__unlocking">
      <swap-looking-animation />
    </div>

    <!-- Forgot Password / Timer sections remain the same -->
    <lock-screen-forgot
      v-show="isForgot"
      :reset="resetAction"
      @toggle:forgot="toggleForgot"
    />
    <lock-screen-timer v-show="isLocked" :close="closeLockedAction" />

    <!-- Forgot password button remains if not in OTP mode -->
    <base-button
      v-show="!isOtpPhase && !isForgot && !isUnlocking"
      title="I forgot my password"
      :click="forgotAction"
      :no-background="true"
      class="lock-screen__forgot"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import LogoBig from '@action/icons/common/logo-big.vue';
import BaseButton from '@action/components/base-button/index.vue';
import LockScreenPasswordInput from './components/lock-screen-password-input.vue';
import LockScreenForgot from './components/lock-screen-forgot.vue';
import LockScreenTimer from './components/lock-screen-timer.vue';
import SwapLookingAnimation from '@action/icons/swap/swap-looking-animation.vue';
import { sendToBackgroundFromAction } from '@/libs/messenger/extension';
import { InternalMethods } from '@/types/messenger';
import { trackGenericEvents } from '@/libs/metrics';
import { GenericEvents } from '@/libs/metrics/types';

const emit = defineEmits<{
  (e: 'update:init'): void;
}>();

// States for password phase
const password = ref(__PREFILL_PASSWORD__!);
const isError = ref(false);
const isDisabled = computed(() => password.value.length < 5 || isUnlocking.value);
const isForgot = ref(false);
const isLocked = ref(false);
const isUnlocking = ref(false);

// States for OTP phase
const isOtpPhase = ref(false);
const otp = ref('');
const otpError = ref(false);

// Retrieve the user's phone number from localStorage
const phoneNumber = ref(localStorage.getItem('user_phone_number') || '');

// This function handles the password unlock process
const unlockAction = async () => {
  isUnlocking.value = true;
  const unlockStatus = await sendToBackgroundFromAction({
    message: JSON.stringify({
      method: InternalMethods.unlock,
      params: [password.value.trim(), true],
    }),
  });
  if (unlockStatus.error) {
    isError.value = true;
    isUnlocking.value = false;
    trackGenericEvents(GenericEvents.login_error);
  } else {
    isError.value = false;
    password.value = '';
    // Instead of immediately unlocking, switch to OTP phase
    isOtpPhase.value = true;
    // Send OTP automatically to user's phone
    await sendOtpAction();
    isUnlocking.value = false;
  }
};

const forgotAction = () => {
  toggleForgot();
};

const passwordChanged = (text: string) => {
  password.value = text;
  isError.value = false;
};

const toggleForgot = () => {
  isForgot.value = !isForgot.value;
};

const resetAction = () => {
  password.value = '';
};

const closeLockedAction = () => {
  isLocked.value = false;
};

// Function to send the OTP via your backend
const sendOtpAction = async () => {
  try {
    // Notice the endpoint is now '/send-otp'
    const response = await fetch('http://localhost:3000/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phoneNumber.value }),
    });
    const data = await response.json();
    if (!data.success) {
      console.error('Failed to send OTP:', data.message);
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
  }
};

// Function to verify the entered OTP via your backend
const verifyOtpAction = async () => {
  isUnlocking.value = true;
  try {
    const response = await fetch('http://localhost:3000/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phoneNumber.value, otp: otp.value }),
    });
    const data = await response.json();
    if (data.success) {
      otpError.value = false;
      // Finalize unlock after successful OTP verification.
      emit('update:init');
      trackGenericEvents(GenericEvents.login_success);
      isOtpPhase.value = false; // Optionally reset OTP phase state
    } else {
      otpError.value = true;
      trackGenericEvents(GenericEvents.login_error);
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    otpError.value = true;
  } finally {
    isUnlocking.value = false;
  }
};
</script>

<style lang="less" scoped>
@import '@action/styles/theme.less';

.lock-screen {
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  &__container {
    width: 800px;
    height: 600px;
    overflow-x: hidden;
    overflow-y: hidden;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 999;
    background: radial-gradient(
        100% 50% at 100% 50%,
        rgba(250, 250, 250, 0.92) 0%,
        rgba(250, 250, 250, 0.98) 100%
      )
      @primary;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }

  &__wrap,
  &__otp {
    width: 320px;
    box-sizing: border-box;
    position: relative;
    text-align: center;
    h4 {
      font-style: normal;
      font-weight: 700;
      font-size: 24px;
      line-height: 32px;
      color: @primaryLabel;
      margin: 0 0 8px;
    }
  }

  &__otp {
    input {
      width: 100%;
      padding: 8px;
      margin: 16px 0;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .error-msg {
      color: red;
      font-size: 14px;
    }
  }

  &__unlocking {
    width: 300px;
    height: 300px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    position: relative;
    svg {
      width: 132px;
      position: relative;
      z-index: 2;
    }
  }

  &__logo {
    margin-bottom: 24px;
  }

  &__forgot {
    position: absolute;
    width: 320px;
    left: 50%;
    margin-left: -160px;
    bottom: 20px;
  }
}
</style>
