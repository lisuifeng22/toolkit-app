import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors, Layout } from '../constants/Colors';

import { HomeScreen } from '../screens/HomeScreen';
import { TodoScreen } from '../screens/TodoScreen';
import { TodoEditorScreen } from '../screens/TodoEditorScreen';
import { NoteScreen } from '../screens/NoteScreen';
import { NoteEditorScreen } from '../screens/NoteEditorScreen';
import { CountdownScreen } from '../screens/CountdownScreen';
import { CountdownEditorScreen } from '../screens/CountdownEditorScreen';
import { BirthdayScreen } from '../screens/BirthdayScreen';
import { AnniversariesScreen } from '../screens/AnniversariesScreen';
import { WeatherScreen } from '../screens/WeatherScreen';
import { PasswordScreen } from '../screens/PasswordScreen';

const Drawer = createDrawerNavigator();
const NotesStack = createNativeStackNavigator();
const TodosStack = createNativeStackNavigator();
const CountdownStack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: Colors.card },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { fontWeight: '600' as const, fontSize: 18 },
};

function NotesStackScreen() {
  return (
    <NotesStack.Navigator screenOptions={stackScreenOptions}>
      <NotesStack.Screen name="NotesList" component={NoteScreen} options={{ title: '便签' }} />
      <NotesStack.Screen name="NoteEditor" component={NoteEditorScreen} options={{ title: '编辑便签' }} />
    </NotesStack.Navigator>
  );
}

function TodosStackScreen() {
  return (
    <TodosStack.Navigator screenOptions={stackScreenOptions}>
      <TodosStack.Screen name="TodosList" component={TodoScreen} options={{ title: '待办' }} />
      <TodosStack.Screen name="TodoEditor" component={TodoEditorScreen} options={{ title: '编辑待办' }} />
    </TodosStack.Navigator>
  );
}

function CountdownStackScreen() {
  return (
    <CountdownStack.Navigator screenOptions={stackScreenOptions}>
      <CountdownStack.Screen name="CountdownsList" component={CountdownScreen} options={{ title: '倒计时' }} />
      <CountdownStack.Screen name="CountdownEditor" component={CountdownEditorScreen} options={{ title: '新建倒计时' }} />
    </CountdownStack.Navigator>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: {
          backgroundColor: 'rgba(124, 58, 237, 0.92)',
          width: 240,
        },
        drawerItemStyle: {
          borderRadius: Layout.radius.base,
          marginHorizontal: Layout.spacing.sm,
        },
        drawerActiveBackgroundColor: 'rgba(255,255,255,0.15)',
        drawerActiveTintColor: '#FFF',
        drawerInactiveTintColor: 'rgba(255,255,255,0.7)',
        headerStyle: {
          backgroundColor: Colors.card,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600' as const,
          color: Colors.textPrimary,
        },
        headerTintColor: Colors.textPrimary,
      }}
    >
      <Drawer.Screen name="Dashboard" component={HomeScreen}
        options={{ title: '首页',
          drawerLabel: '首页',
          drawerIcon: () => null,
        }} />
      <Drawer.Screen name="Notes" component={NotesStackScreen}
        options={{ title: '便签', drawerLabel: '便签', headerShown: false }} />
      <Drawer.Screen name="Todos" component={TodosStackScreen}
        options={{ title: '待办', drawerLabel: '待办', headerShown: false }} />
      <Drawer.Screen name="Countdowns" component={CountdownStackScreen}
        options={{ title: '倒计时', drawerLabel: '倒计时', headerShown: false }} />
      <Drawer.Screen name="Birthdays" component={BirthdayScreen}
        options={{ title: '生日', drawerLabel: '生日' }} />
      <Drawer.Screen name="Anniversaries" component={AnniversariesScreen}
        options={{ title: '纪念日', drawerLabel: '纪念日' }} />
      <Drawer.Screen name="Weather" component={WeatherScreen}
        options={{ title: '天气', drawerLabel: '天气' }} />
      <Drawer.Screen name="Password" component={PasswordScreen}
        options={{ title: '密码本', drawerLabel: '密码本' }} />
    </Drawer.Navigator>
  );
}
