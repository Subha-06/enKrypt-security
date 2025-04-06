<template>
    <div class="enter-phone">
      <h3 class="enter-phone__title">Verify Your Identity</h3>
      <p class="enter-phone__description">
        Enter your phone number to receive a verification code.
      </p>
  
      <div class="enter-phone__form">
        <label for="phoneNumber" class="enter-phone__label">Phone Number</label>
        <input
          id="phoneNumber"
          v-model="phoneNumber"
          type="tel"
          placeholder="+1 123 456 7890"
          class="enter-phone__input"
        />
  
        <!-- Next button -->
        <button
          class="enter-phone__button"
          @click="sendOtpAndProceed"
          :disabled="phoneNumber.trim().length < 10"
        >
          Next
        </button>
      </div>
  
      <p class="enter-phone__hint">
        Make sure you enter a valid phone number with country code.
      </p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useOnboardStore } from './store';
  
  const router = useRouter();
  const store = useOnboardStore();
  const phoneNumber = ref('');
  
  // 1) Send OTP to Twilio backend, then proceed
  async function sendOtpAndProceed() {
    const trimmedPhone = phoneNumber.value.trim();
    if (!trimmedPhone || trimmedPhone.length < 10) {
      alert("Please enter a valid phone number.");
      return;
    }
  
    try {
      // Call your Node.js server's /send-otp endpoint
      const response = await fetch('http://localhost:3000/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: trimmedPhone })
      });
  
      const data = await response.json();
      if (data.success) {
        // Save the phone number in your store so we can use it later
        store.setPhoneNumber(trimmedPhone);
        // Navigate to the OTP input screen
        router.push({ name: 'create-wallet-sms-authentication' });
      } else {
        alert(`Error sending OTP: ${data.message}`);
      }
    } catch (error) {
      console.error('Network error sending OTP:', error);
      alert('Failed to send OTP. Check the console for details.');
    }
  }
  </script>
  
  <style lang="less">
  @import '@/ui/action/styles/theme.less';
  
  .enter-phone {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  
    &__title {
      font-style: normal;
      font-weight: 700;
      font-size: 34px;
      line-height: 40px;
      color: @primaryLabel;
      margin-bottom: 8px;
    }
  
    &__description {
      font-size: 16px;
      color: @secondaryLabel;
      margin-bottom: 16px;
    }
  
    &__form {
      width: 100%;
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }
  
    &__label {
      font-size: 14px;
      color: @secondaryLabel;
    }
  
    &__input {
      width: 80%;
      padding: 12px;
      font-size: 16px;
      border: 1px solid @border;
      border-radius: 8px;
      text-align: center;
    }
  
    &__button {
      width: 50%;
      padding: 12px;
      font-size: 16px;
      font-weight: 600;
      color: white;
      background-color: #6200ea;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: 0.3s ease;
      
      &:disabled {
        background-color: white;
        cursor: not-allowed;
      }
  
      &:hover:not(:disabled) {
        background-color: darken(#6200ea, 10%);
      }
    }
  
    &__hint {
      font-size: 14px;
      color: @secondaryLabel;
      margin-top: 10px;
    }
  }
  </style>
  