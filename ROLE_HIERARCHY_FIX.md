# 🔧 Correction de la Hiérarchie des Rôles

## 📋 Problème Identifié

Le système de gestion de rôles avait un **problème critique** :

### Symptôme

Les **directeurs ne pouvaient pas voir leurs commerciaux** dans l'interface, même si ces commerciaux étaient supervisés par des managers de leur équipe.

### Cause Racine

Lors de la création/modification d'un commercial :

- Seul le `managerId` était assigné
- Le `directeurId` n'était **JAMAIS** assigné automatiquement
- Les filtres vérifient `commercial.directeurId === directeurId` pour les directeurs
- Résultat : aucun commercial n'apparaissait pour les directeurs

## ✅ Solution Implémentée

### 1. Backend - Assignation Automatique

Le service `CommercialService` a été modifié pour **assigner automatiquement** le `directeurId` :

#### Lors de la création (`create`) :

```typescript
// Si un managerId est fourni, récupérer automatiquement le directeurId du manager
if (data.managerId && !directeurId) {
  const manager = await this.prisma.manager.findUnique({
    where: { id: data.managerId },
    select: { directeurId: true },
  });

  if (manager?.directeurId) {
    directeurId = manager.directeurId;
  }
}
```

#### Lors de la modification (`update`) :

```typescript
// Si le managerId est modifié, mettre à jour automatiquement le directeurId
if (updateData.managerId !== undefined && !directeurId) {
  const manager = await this.prisma.manager.findUnique({
    where: { id: updateData.managerId },
    select: { directeurId: true },
  });

  if (manager?.directeurId) {
    directeurId = manager.directeurId;
  }
}
```

### 2. Script de Correction des Données Existantes

Un script a été créé pour corriger les commerciaux existants : `backend/prisma/fix-commercial-directeur.ts`

#### Comment l'utiliser :

```bash
cd backend
npx ts-node prisma/fix-commercial-directeur.ts
```

Ce script :

- ✅ Trouve tous les commerciaux avec un manager mais sans directeur
- ✅ Assigne automatiquement le `directeurId` du manager
- ✅ Affiche un rapport détaillé des corrections

## 🎯 Hiérarchie Validée

Après cette correction, la hiérarchie fonctionne correctement :

```
┌─────────────────────────────────────────────────────────┐
│                    👑 ADMIN                              │
│  - Voit TOUT                                             │
│  - Gère tous les directeurs, managers et commerciaux    │
└─────────────────────┬───────────────────────────────────┘
                      │
            ┌─────────┴─────────┐
            │                   │
┌───────────▼──────────┐  ┌────▼──────────────┐
│  📊 DIRECTEUR 1      │  │  📊 DIRECTEUR 2   │
│  - Voit ses managers │  │  - Voit ses...    │
│  - Voit TOUS ses     │  │                   │
│    commerciaux       │  │                   │
│    (directs + via    │  │                   │
│     managers)        │  │                   │
└──────────┬───────────┘  └───────────────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼────┐ ┌───▼─────┐
│ MANAGER │ │ MANAGER │
│    1    │ │    2    │
└────┬────┘ └────┬────┘
     │           │
   ┌─┴──┐      ┌─┴──┐
   │ C1 │      │ C2 │  Commercial
   └────┘      └────┘
```

### Relations dans la Base de Données

**Commercial** :

- `managerId` → Le manager direct qui supervise ce commercial
- `directeurId` → Le directeur qui supervise l'équipe (assigné automatiquement à partir du manager)

**Manager** :

- `directeurId` → Le directeur qui supervise ce manager

**Directeur** :

- Pas de référence (niveau supérieur sous l'admin)

## 🔍 Filtrage Basé sur les Rôles

### Admin

```typescript
ADMIN: () => commercials; // Voit TOUT
```

### Directeur

```typescript
DIRECTEUR: () =>
  commercials.filter((commercial) => commercial.directeurId === userIdInt);
```

✅ Maintenant fonctionnel : voit tous les commerciaux de son équipe

### Manager

```typescript
MANAGER: () =>
  commercials.filter((commercial) => commercial.managerId === userIdInt);
```

✅ Voit seulement ses commerciaux directs

## 🧪 Tests Recommandés

1. **Créer un nouveau commercial** avec un manager :
   - Vérifier que le `directeurId` est automatiquement assigné
2. **Modifier le manager d'un commercial** :

   - Vérifier que le `directeurId` est mis à jour

3. **Se connecter en tant que directeur** :

   - Vérifier que tous les commerciaux de l'équipe sont visibles

4. **Se connecter en tant que manager** :
   - Vérifier que seuls les commerciaux directs sont visibles

## 📊 Permissions par Rôle

| Entité       | Admin           | Directeur              | Manager                  |
| ------------ | --------------- | ---------------------- | ------------------------ |
| Commerciaux  | ✅ CRUD complet | ✅ CRUD (son équipe)   | ✅ CRU (ses commerciaux) |
| Managers     | ✅ CRUD complet | ✅ CRUD (ses managers) | ❌ Lecture seule         |
| Directeurs   | ✅ CRUD complet | ✅ R (lui-même)        | ❌ Aucun accès           |
| Zones        | ✅ CRUD complet | ✅ CRU (son équipe)    | ✅ CRU (ses commerciaux) |
| Immeubles    | ✅ CRUD complet | ✅ CRU (son équipe)    | ✅ CRU (ses commerciaux) |
| Statistiques | ✅ CRUD complet | ✅ R (son équipe)      | ✅ CRU (ses commerciaux) |

**Légende** : C = Create, R = Read, U = Update, D = Delete

## 🚀 Déploiement

### Étapes :

1. **Recompiler le backend** :

   ```bash
   cd backend
   npm run build
   ```

2. **Exécuter le script de correction** :

   ```bash
   npx ts-node prisma/fix-commercial-directeur.ts
   ```

3. **Redémarrer le serveur** :

   ```bash
   npm run start:dev
   ```

4. **Tester l'interface frontend** avec différents rôles

## 📝 Notes Importantes

- ⚠️ Le `directeurId` est maintenant **automatiquement géré** par le backend
- ⚠️ Si un manager n'a pas de directeur assigné, le commercial n'aura pas non plus de directeur
- ✅ Aucune modification du frontend n'est nécessaire
- ✅ Les données existantes doivent être corrigées avec le script

## 🔗 Fichiers Modifiés

- `backend/src/commercial/commercial.service.ts` - Logique d'assignation automatique
- `backend/prisma/fix-commercial-directeur.ts` - Script de correction (nouveau)
- `ROLE_HIERARCHY_FIX.md` - Cette documentation (nouveau)
