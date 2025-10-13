# 🧪 Guide de Test des Filtres par Rôle

## 📋 Configuration du localStorage

Pour tester chaque rôle, modifiez le localStorage dans la console du navigateur :

```javascript
// ADMIN
localStorage.setItem("currentRole", "admin");
localStorage.setItem("currentUserId", "1");

// DIRECTEUR 1 (Fatma Gharbi)
localStorage.setItem("currentRole", "directeur");
localStorage.setItem("currentUserId", "1");

// MANAGER 1 (Ahmed Ben Salem)
localStorage.setItem("currentRole", "manager");
localStorage.setItem("currentUserId", "1");
```

Puis rechargez la page.

---

## 👤 ADMIN (ID: 1)

### ✅ Ce que l'admin doit voir :

#### 📊 **Directeurs** (2 directeurs)

- ✅ Fatma Gharbi
- ✅ Mohamed Triki

#### 👨‍💼 **Managers** (2 managers)

- ✅ Ahmed Ben Salem (Directeur: Fatma Gharbi)
- ✅ Sarra Khelifi (Directeur: Mohamed Triki)

#### 💼 **Commerciaux** (3 commerciaux)

- ✅ Ahmed Ben Ali (Manager: Ahmed Ben Salem, Directeur: Fatma Gharbi)
- ✅ Sarra Mejri (Manager: Sarra Khelifi, Directeur: Mohamed Triki)
- ✅ Karim Ouali (Manager: Ahmed Ben Salem, Directeur: Fatma Gharbi)

#### 🗺️ **Zones** (5 zones)

- ✅ **Tunis Centre** (assignée à Directeur 1: Fatma Gharbi)
  - Commerciaux: Ahmed Ben Ali
- ✅ **Sfax** (assignée à Manager 2: Sarra Khelifi)
  - Commerciaux: Sarra Mejri
- ✅ **Sousse** (non assignée directement)
  - Commerciaux: Karim Ouali
- ✅ **Ariana** (assignée à Manager 1: Ahmed Ben Salem)
  - Commerciaux: Ahmed Ben Ali, Karim Ouali
- ✅ **Monastir** (assignée à Directeur 2: Mohamed Triki)
  - Commerciaux: Sarra Mejri

#### 🏢 **Immeubles** (4 immeubles)

- ✅ 10 Rue de la Liberté, Tunis (Commercial: Ahmed Ben Ali)
- ✅ 25 Avenue Habib Bourguiba, Tunis (Commercial: Ahmed Ben Ali)
- ✅ 15 Rue Ali Bach Hamba, Sfax (Commercial: Sarra Mejri)
- ✅ 30 Avenue Farhat Hached, Sousse (Commercial: Karim Ouali)

#### 📊 **Statistiques** (6 statistiques)

- ✅ Commercial1 (Ahmed Ben Ali) - Zone: Tunis Centre - 28 contrats
- ✅ Commercial1 (Ahmed Ben Ali) - Zone: Ariana - 22 contrats
- ✅ Commercial2 (Sarra Mejri) - Zone: Sfax - 35 contrats
- ✅ Commercial2 (Sarra Mejri) - Zone: Monastir - 42 contrats
- ✅ Commercial3 (Karim Ouali) - Zone: Sousse - 15 contrats
- ✅ Commercial3 (Karim Ouali) - Zone: Ariana - 18 contrats

---

## 👔 DIRECTEUR 1 - Fatma Gharbi (ID: 1)

### ✅ Ce que Directeur 1 doit voir :

#### 📊 **Directeurs** (1 directeur - soi-même)

- ✅ Fatma Gharbi (soi-même)
- ❌ Mohamed Triki (autre directeur)

#### 👨‍💼 **Managers** (1 manager de sa division)

- ✅ Ahmed Ben Salem (son manager, directeurId: 1)
- ❌ Sarra Khelifi (manager d'une autre division)

#### 💼 **Commerciaux** (2 commerciaux de sa division)

- ✅ Ahmed Ben Ali (directeurId: 1)
- ✅ Karim Ouali (directeurId: 1)
- ❌ Sarra Mejri (directeurId: 2, autre division)

#### 🗺️ **Zones** (3 zones)

**Pourquoi 3 zones ?**

1. Zone assignée directement à lui (directeurId: 1)
2. Zones où ses commerciaux travaillent

- ✅ **Tunis Centre** (assignée directement à lui, directeurId: 1)
  - Raison: directeurId = 1
  - Commercial qui y travaille: Ahmed Ben Ali (son commercial)
- ✅ **Ariana** (assignée à son Manager 1)
  - Raison: Ses commerciaux (Ahmed Ben Ali et Karim Ouali) y travaillent
  - Bien que managerId = 1, elle apparaît car ses commerciaux y sont
- ✅ **Sousse** (non assignée directement)
  - Raison: Son commercial (Karim Ouali) y travaille
- ❌ **Sfax** (Manager 2, Commercial 2 qui n'est pas le sien)
- ❌ **Monastir** (Directeur 2, pas ses commerciaux)

#### 🏢 **Immeubles** (3 immeubles)

**Les immeubles gérés par ses commerciaux:**

- ✅ 10 Rue de la Liberté, Tunis (Commercial: Ahmed Ben Ali)
- ✅ 25 Avenue Habib Bourguiba, Tunis (Commercial: Ahmed Ben Ali)
- ✅ 30 Avenue Farhat Hached, Sousse (Commercial: Karim Ouali)
- ❌ 15 Rue Ali Bach Hamba, Sfax (Commercial: Sarra Mejri, autre division)

#### 📊 **Statistiques** (4 statistiques)

**Les stats de ses commerciaux:**

- ✅ Commercial1 (Ahmed Ben Ali) - Zone: Tunis Centre - 28 contrats
- ✅ Commercial1 (Ahmed Ben Ali) - Zone: Ariana - 22 contrats
- ✅ Commercial3 (Karim Ouali) - Zone: Sousse - 15 contrats
- ✅ Commercial3 (Karim Ouali) - Zone: Ariana - 18 contrats
- ❌ Commercial2 (Sarra Mejri) - toutes ses stats (autre division)

**Total contrats signés par sa division: 83 contrats**

---

## 👨‍💼 MANAGER 1 - Ahmed Ben Salem (ID: 1)

### ✅ Ce que Manager 1 doit voir :

#### 📊 **Directeurs**

- ❌ Aucun (les managers ne voient pas les directeurs)

#### 👨‍💼 **Managers**

- ❌ Aucun (les managers ne voient pas les autres managers)

#### 💼 **Commerciaux** (2 commerciaux de son équipe)

- ✅ Ahmed Ben Ali (managerId: 1)
- ✅ Karim Ouali (managerId: 1)
- ❌ Sarra Mejri (managerId: 2, autre équipe)

#### 🗺️ **Zones** (3 zones)

**Pourquoi 3 zones ?**

1. Zone assignée directement à lui (managerId: 1)
2. Zones où ses commerciaux travaillent

- ✅ **Ariana** (assignée directement à lui, managerId: 1)
  - Raison: managerId = 1
  - Commerciaux qui y travaillent: Ahmed Ben Ali, Karim Ouali
- ✅ **Tunis Centre** (assignée au Directeur 1)
  - Raison: Son commercial (Ahmed Ben Ali) y travaille
  - Même si directeurId = 1, elle apparaît car son commercial y est
- ✅ **Sousse** (non assignée directement)
  - Raison: Son commercial (Karim Ouali) y travaille
- ❌ **Sfax** (Manager 2, pas ses commerciaux)
- ❌ **Monastir** (Directeur 2, pas ses commerciaux)

#### 🏢 **Immeubles** (3 immeubles)

**Les immeubles gérés par ses commerciaux:**

- ✅ 10 Rue de la Liberté, Tunis (Commercial: Ahmed Ben Ali)
- ✅ 25 Avenue Habib Bourguiba, Tunis (Commercial: Ahmed Ben Ali)
- ✅ 30 Avenue Farhat Hached, Sousse (Commercial: Karim Ouali)
- ❌ 15 Rue Ali Bach Hamba, Sfax (Commercial: Sarra Mejri, autre équipe)

#### 📊 **Statistiques** (4 statistiques)

**Les stats de ses commerciaux:**

- ✅ Commercial1 (Ahmed Ben Ali) - Zone: Tunis Centre - 28 contrats
- ✅ Commercial1 (Ahmed Ben Ali) - Zone: Ariana - 22 contrats
- ✅ Commercial3 (Karim Ouali) - Zone: Sousse - 15 contrats
- ✅ Commercial3 (Karim Ouali) - Zone: Ariana - 18 contrats
- ❌ Commercial2 (Sarra Mejri) - toutes ses stats (autre équipe)

**Total contrats signés par son équipe: 83 contrats**

---

## 🎯 Résumé Comparatif

| Élément            | Admin | Directeur 1     | Manager 1      |
| ------------------ | ----- | --------------- | -------------- |
| **Directeurs**     | 2     | 1 (soi)         | 0              |
| **Managers**       | 2     | 1 (le sien)     | 0              |
| **Commerciaux**    | 3     | 2 (sa division) | 2 (son équipe) |
| **Zones**          | 5     | 3               | 3              |
| **Immeubles**      | 4     | 3               | 3              |
| **Statistiques**   | 6     | 4               | 4              |
| **Total Contrats** | 160   | 83              | 83             |

---

## 🔍 Points de Vérification Importants

### ✅ Zones - Logique de Filtrage

#### Directeur 1 voit :

1. ✅ **Tunis Centre** → directeurId = 1 (assignée directement)
2. ✅ **Ariana** → Ses commerciaux (1 et 3) y travaillent
3. ✅ **Sousse** → Son commercial (3) y travaille

#### Manager 1 voit :

1. ✅ **Ariana** → managerId = 1 (assignée directement)
2. ✅ **Tunis Centre** → Son commercial (1) y travaille
3. ✅ **Sousse** → Son commercial (3) y travaille

### 📊 Statistiques Détaillées

#### Pour Directeur 1 et Manager 1 (mêmes stats):

```
Commercial 1 (Ahmed Ben Ali):
  - Zone Tunis Centre: 28 contrats, 45 immeubles visités, 152 portes prospectées
  - Zone Ariana: 22 contrats, 38 immeubles visités, 128 portes prospectées

Commercial 3 (Karim Ouali):
  - Zone Sousse: 15 contrats, 28 immeubles visités, 96 portes prospectées
  - Zone Ariana: 18 contrats, 32 immeubles visités, 112 portes prospectées

TOTAL: 83 contrats, 143 immeubles visités, 488 portes prospectées
```

---

## 🐛 Checklist de Test

### Pour chaque rôle, vérifiez :

- [ ] Les compteurs/cartes affichent les bons totaux
- [ ] Les tableaux n'affichent que les données filtrées
- [ ] Aucune donnée d'autres divisions n'apparaît
- [ ] Les permissions (ajouter/modifier/supprimer) sont correctes
- [ ] Les descriptions de page reflètent le rôle
- [ ] Les zones assignées directement apparaissent bien
- [ ] Les zones des commerciaux apparaissent bien
- [ ] Les statistiques sont agrégées correctement

---

## 🚨 Bugs Potentiels à Surveiller

1. **Zone apparaît en double** : Si une zone est assignée au directeur ET que ses commerciaux y travaillent

   - ✅ Devrait apparaître une seule fois grâce au filtre

2. **Statistiques manquantes** : Vérifier que toutes les stats des commerciaux apparaissent

   - ✅ Les stats avec zoneId devraient apparaître

3. **Permissions incorrectes** : Un manager ne devrait pas pouvoir supprimer des zones
   - ✅ Vérifier que les boutons n'apparaissent pas

---

## 📝 Comment Tester

1. **Ouvrir la console du navigateur** (F12)
2. **Définir le rôle** avec les commandes localStorage ci-dessus
3. **Recharger la page** (F5)
4. **Naviguer dans chaque section** :
   - Dashboard (vérifier les totaux)
   - Directeurs
   - Managers
   - Commerciaux
   - Zones
   - Immeubles
5. **Comparer avec ce document** ✅

---

Créé le: 2025-01-10
Version: 1.0
