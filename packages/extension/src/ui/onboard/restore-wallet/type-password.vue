<template>
  <div class="type-password">
    <h3 class="type-password__title">Confirm your password</h3>
    <p class="type-password__description">
      Enkrypt is non-custodial. We cannot restore or reset your password for
      you. Make sure you remember it.
    </p>

    <div class="type-password__form">
      <base-input
        type="password"
        :value="typePassword"
        placeholder="Password"
        @update:value="passwordUpdated"
        @keyup.enter="nextAction"
      />

      <div
        v-if="isDisabled && typePassword.length > 0 && !isInitializing"
        class="type-password__error"
      >
        Passwords don't match
      </div>

      <base-button title="Next" :click="nextAction" :disabled="isDisabled" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import BaseButton from '@action/components/base-button/index.vue';
import BaseInput from '@action/components/base-input/index.vue';
import { useRouter } from 'vue-router';
import { useRestoreStore } from './store';

// We'll redirect to "restore-wallet-enter-phone" after password confirmation
// Make sure you have a route definition for that final name.
const router = useRouter();
const store = useRestoreStore();

const typePassword = ref('');
const isInitializing = ref(false);

/**
 * Called when the user presses "Next" or hits Enter.
 * If the typed password matches the stored password, we navigate
 * to the "restore-wallet-enter-phone" route.
 */
const nextAction = () => {
  if (!isDisabled.value) {
    isInitializing.value = true;

    // ✅ Redirect to the Enter Phone screen
    router.push({ name: 'restore-wallet-enter-phone' });

    isInitializing.value = false;
  }
};

/**
 * Disable the button if password mismatch or if we are initializing.
 */
const isDisabled = computed(() => {
  return typePassword.value !== store.password || isInitializing.value;
});

/**
 * Update our local password when user types.
 */
const passwordUpdated = (value: string) => {
  typePassword.value = value.trim();
};

/**
 * Ensure the user has both password and mnemonic in the store.
 * Otherwise, we redirect them to the start screen (adjust if needed).
 */
const checkMnemonicAndPassword = () => {
  if (!store.password || !store.mnemonic) {
    // Make sure you have a route named 'restore-wallet-start'
    router.push({ name: 'restore-wallet-start' });
  }
};

onMounted(() => {
  checkMnemonicAndPassword();
});
</script>

<style lang="less">
@import '@action/styles/theme.less';

.type-password {
  width: 100%;

  &__title {
    font-style: normal;
    font-weight: 700;
    font-size: 34px;
    line-height: 40px;
    letter-spacing: 0.25px;
    color: @primaryLabel;
    margin: 0 0 8px 0;
  }

  &__description {
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    color: @secondaryLabel;
    margin: 0;
  }

  &__form {
    padding: 16px 0;

    .button {
      margin-top: 16px;
    }
  }

  &__error {
    padding-top: 8px;
    padding-left: 12px;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.25px;
    color: @error;
  }

  &__label {
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: @secondaryLabel;
    margin: 0;
  }
}
</style>
