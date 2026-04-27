<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="6" class="text-center">
        <v-icon size="96" color="grey-lighten-1" class="mb-4">mdi-file-question</v-icon>
        <h1 class="text-h3 font-weight-bold text-grey-darken-2 mb-2">404</h1>
        <p class="text-h6 text-medium-emphasis mb-6">Página no encontrada</p>
        <v-btn color="primary" prepend-icon="mdi-home" rounded="lg" @click="$router.push('/')">
          Ir al inicio
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
