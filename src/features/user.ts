import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  isRegistered: boolean;
  showRegistrationModal: boolean;
  username: string | null;
  avatar: string | null;
  createdAt: string | null;
  lastProfileUpdate: string | null;
}

const initialState: UserState = {
  isRegistered: false,
  showRegistrationModal: false,
  username: null,
  avatar: null,
  createdAt: null,
  lastProfileUpdate: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setShowRegistrationModal: (state, action: PayloadAction<boolean>) => {
      state.showRegistrationModal = action.payload;
    },
    setUserRegistered: (state, action: PayloadAction<boolean>) => {
      state.isRegistered = action.payload;
    },
    setUserInfo: (state, action: PayloadAction<{ username: string; avatar: string; createdAt: string; lastProfileUpdate: string }>) => {
      state.username = action.payload.username;
      state.avatar = action.payload.avatar;
      state.createdAt = action.payload.createdAt;
      state.lastProfileUpdate = action.payload.lastProfileUpdate;
    },
    resetUserState: () => {
      return initialState;
    }
  }
});

export const { setShowRegistrationModal, setUserRegistered, setUserInfo, resetUserState } = userSlice.actions;

export default userSlice.reducer;