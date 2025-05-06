// This file is used to define the layout for the admin section of the app.
// app/(admin)/_layout.tsx

import { Stack } from "expo-router";


export default function AdminLayout() {
  return (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="students" options={{ headerShown: false }} />
        <Stack.Screen name="departments" options={{ headerShown: false }} />
        <Stack.Screen name="enrollments" options={{ headerShown: false }} />
        <Stack.Screen name="bill-items" options={{ headerShown: false }} />
        <Stack.Screen name="department-students" options={{ headerShown: false }} />
      </Stack>

  );
}