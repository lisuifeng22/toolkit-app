import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { colors, fontSize } from './src/theme';
import { DrawerContent } from './src/components/DrawerContent';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { WeatherScreen } from './src/screens/WeatherScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { NoteEditorScreen } from './src/screens/NoteEditorScreen';
import { TodosScreen } from './src/screens/TodosScreen';
import { TodoEditorScreen } from './src/screens/TodoEditorScreen';
import { CountdownsScreen } from './src/screens/CountdownsScreen';
import { CountdownEditorScreen } from './src/screens/CountdownEditorScreen';
import { BirthdaysScreen } from './src/screens/BirthdaysScreen';
import { AnniversariesScreen } from './src/screens/AnniversariesScreen';
import { PasswordScreen } from './src/screens/PasswordScreen';

const Drawer = createDrawerNavigator();
const NotesStack = createNativeStackNavigator();
const TodosStack = createNativeStackNavigator();
const CountdownStack = createNativeStackNavigator();

function MenuButton({ navigation }: any) {
  return (
    <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: Platform.OS === 'web' ? 16 : 8, padding: 4 }}>
      <Text style={{ fontSize: 22, color: colors.text }}>☰</Text>
    </TouchableOpacity>
  );
}

function BackButton({ navigation }: any) {
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{ marginLeft: 8, padding: 4, flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, color: colors.text, marginRight: 4 }}>‹</Text>
      <MenuButton navigation={navigation} />
    </TouchableOpacity>
  );
}

function NotesStackScreen() {
  return (
    <NotesStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.white }, headerTintColor: colors.text }}>
      <NotesStack.Screen name="NotesList" component={NotesScreen} options={({ navigation }) => ({
        title: '便签',
        headerLeft: () => <BackButton navigation={navigation} />,
      })} />
      <NotesStack.Screen name="NoteEditor" component={NoteEditorScreen} options={{ title: '编辑便签' }} />
    </NotesStack.Navigator>
  );
}

function TodosStackScreen() {
  return (
    <TodosStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.white }, headerTintColor: colors.text }}>
      <TodosStack.Screen name="TodosList" component={TodosScreen} options={({ navigation }) => ({
        title: '待办',
        headerLeft: () => <BackButton navigation={navigation} />,
      })} />
      <TodosStack.Screen name="TodoEditor" component={TodoEditorScreen} options={{ title: '编辑待办' }} />
    </TodosStack.Navigator>
  );
}

function CountdownStackScreen() {
  return (
    <CountdownStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.white }, headerTintColor: colors.text }}>
      <CountdownStack.Screen name="CountdownsList" component={CountdownsScreen} options={({ navigation }) => ({
        title: '倒计时',
        headerLeft: () => <BackButton navigation={navigation} />,
      })} />
      <CountdownStack.Screen name="CountdownEditor" component={CountdownEditorScreen} options={{ title: '新建倒计时' }} />
    </CountdownStack.Navigator>
  );
}

function createScreenOptions(title: string, showBack = false) {
  return ({ navigation }: any) => ({
    title,
    headerLeft: () => showBack ? <BackButton navigation={navigation} /> : <MenuButton navigation={navigation} />,
    headerStyle: { backgroundColor: colors.white },
    headerTintColor: colors.text,
  });
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Drawer.Navigator
          drawerContent={(props) => <DrawerContent {...props} />}
          screenOptions={{
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.text,
          }}
        >
          <Drawer.Screen name="Dashboard" component={DashboardScreen}
            options={createScreenOptions('工具集')} />
          <Drawer.Screen name="Weather" component={WeatherScreen}
            options={createScreenOptions('天气', true)} />
          <Drawer.Screen name="Notes" component={NotesStackScreen}
            options={{ headerShown: false }} />
          <Drawer.Screen name="Todos" component={TodosStackScreen}
            options={{ headerShown: false }} />
          <Drawer.Screen name="Countdowns" component={CountdownStackScreen}
            options={{ headerShown: false }} />
          <Drawer.Screen name="Birthdays" component={BirthdaysScreen}
            options={createScreenOptions('生日', true)} />
          <Drawer.Screen name="Anniversaries" component={AnniversariesScreen}
            options={createScreenOptions('纪念日', true)} />
          <Drawer.Screen name="Password" component={PasswordScreen}
            options={createScreenOptions('密码本', true)} />
        </Drawer.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
