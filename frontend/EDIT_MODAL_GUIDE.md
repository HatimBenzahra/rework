# 📝 Guide d'utilisation du Modal d'Édition

## Vue d'ensemble

Le `EditModal` est un composant réutilisable et adaptable qui permet de modifier n'importe quelle entité dans votre application. Il s'intègre parfaitement avec le composant `AdvancedDataTable`.

## 🎯 Caractéristiques

✅ **Réutilisable** : Un seul composant pour toutes les entités  
✅ **Adaptable** : Configuration flexible des champs  
✅ **Validation** : Validation intégrée des formulaires  
✅ **Sections** : Groupement des champs par sections  
✅ **Types multiples** : text, email, tel, number, textarea, select, date  
✅ **Style cohérent** : Design shadcn/ui propre et moderne  

## 📦 Installation

Le modal utilise les composants shadcn/ui suivants (déjà installés) :
- Dialog
- Label
- Input
- Button
- Separator

## 🚀 Utilisation rapide

### 1. Définir les champs d'édition

```jsx
const editFields = [
  {
    key: 'name',                    // Clé de la donnée
    label: 'Nom complet',           // Label affiché
    type: 'text',                   // Type de champ
    required: true,                 // Champ obligatoire
    section: 'Informations',        // Section (optionnel)
    placeholder: 'Entrez le nom',   // Placeholder (optionnel)
    hint: 'Format: Prénom Nom',     // Aide contextuelle (optionnel)
    fullWidth: false,               // Pleine largeur (optionnel)
    validate: (value) => {          // Validation personnalisée (optionnel)
      if (!value) return 'Requis'
    }
  },
  // ... autres champs
]
```

### 2. Ajouter au tableau

```jsx
<AdvancedDataTable
  data={myData}
  columns={myColumns}
  editFields={editFields}
  onEdit={handleEdit}
  // ... autres props
/>
```

### 3. Gérer la sauvegarde

```jsx
const handleEdit = (editedData) => {
  console.log('Données modifiées:', editedData)
  // Faire un appel API pour sauvegarder
  // fetch('/api/update', { method: 'PUT', body: JSON.stringify(editedData) })
}
```

## 📋 Types de champs disponibles

### Text Input
```jsx
{
  key: 'name',
  label: 'Nom',
  type: 'text',
  placeholder: 'Entrez le nom',
  required: true
}
```

### Email Input
```jsx
{
  key: 'email',
  label: 'Email',
  type: 'email',
  required: true,
  validate: (value) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Email invalide'
    }
  }
}
```

### Phone Input
```jsx
{
  key: 'phone',
  label: 'Téléphone',
  type: 'tel',
  placeholder: '+216 XX XXX XXX'
}
```

### Number Input
```jsx
{
  key: 'age',
  label: 'Âge',
  type: 'number',
  placeholder: '25'
}
```

### Textarea
```jsx
{
  key: 'description',
  label: 'Description',
  type: 'textarea',
  placeholder: 'Entrez une description',
  fullWidth: true  // Prend toute la largeur
}
```

### Select (Liste déroulante)
```jsx
{
  key: 'status',
  label: 'Statut',
  type: 'select',
  required: true,
  options: [
    { value: 'actif', label: 'Actif' },
    { value: 'inactif', label: 'Inactif' }
  ]
}
```

### Date Input
```jsx
{
  key: 'date_embauche',
  label: 'Date d\'embauche',
  type: 'date'
}
```

## 🎨 Organisation en sections

Groupez vos champs par sections pour une meilleure organisation :

```jsx
const editFields = [
  {
    key: 'name',
    label: 'Nom',
    type: 'text',
    section: 'Informations personnelles'  // Section 1
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    section: 'Informations personnelles'  // Section 1
  },
  {
    key: 'zone',
    label: 'Zone',
    type: 'select',
    section: 'Affectation',  // Section 2
    options: [...]
  }
]
```

Les champs seront automatiquement groupés avec des titres de sections.

## ✅ Validation

### Validation automatique

- **required: true** → Le champ ne peut pas être vide

### Validation personnalisée

```jsx
{
  key: 'email',
  label: 'Email',
  type: 'email',
  validate: (value) => {
    if (!value) return 'Email requis'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Format email invalide'
    }
    // Retourner undefined si pas d'erreur
  }
}
```

## 📱 Responsive

Le modal s'adapte automatiquement :
- **Mobile** : 1 colonne
- **Desktop** : 2 colonnes (par défaut)
- **fullWidth: true** : Force 2 colonnes sur desktop

## 🎯 Exemple complet - Commerciaux

```jsx
const commerciauxEditFields = [
  // Informations personnelles
  {
    key: 'name',
    label: 'Nom complet',
    type: 'text',
    required: true,
    section: 'Informations personnelles',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    section: 'Informations personnelles',
    validate: (value) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Email invalide'
      }
    },
  },
  {
    key: 'phone',
    label: 'Téléphone',
    type: 'tel',
    required: true,
    section: 'Informations personnelles',
    placeholder: '+216 XX XXX XXX',
  },
  
  // Affectation
  {
    key: 'zone',
    label: 'Zone',
    type: 'select',
    required: true,
    section: 'Affectation',
    options: [
      { value: 'Tunis Centre', label: 'Tunis Centre' },
      { value: 'Sfax', label: 'Sfax' },
    ],
  },
  {
    key: 'manager',
    label: 'Manager',
    type: 'select',
    required: true,
    section: 'Affectation',
    options: [
      { value: 'Fatma Gharbi', label: 'Fatma Gharbi' },
      { value: 'Mohamed Triki', label: 'Mohamed Triki' },
    ],
  },
  
  // Performance
  {
    key: 'objectif',
    label: 'Objectif (TND)',
    type: 'text',
    section: 'Performance',
    placeholder: '50 000 TND',
  },
]

// Utilisation dans le composant
export default function Commerciaux() {
  const handleEditCommercial = (editedData) => {
    console.log('Commercial modifié:', editedData)
    // Appel API ici
  }

  return (
    <AdvancedDataTable
      data={commerciauxData}
      columns={commerciauxColumns}
      editFields={commerciauxEditFields}
      onEdit={handleEditCommercial}
    />
  )
}
```

## 🔧 Props du EditModal

| Prop | Type | Description | Requis |
|------|------|-------------|--------|
| `open` | boolean | État d'ouverture du modal | ✅ |
| `onOpenChange` | function | Fonction pour changer l'état | ✅ |
| `title` | string | Titre du modal | ✅ |
| `description` | string | Description du modal | ❌ |
| `data` | object | Données à éditer | ✅ |
| `fields` | array | Configuration des champs | ✅ |
| `onSave` | function | Fonction appelée à la sauvegarde | ✅ |

## 🎨 Personnalisation

Le modal utilise les classes Tailwind et s'adapte automatiquement au thème de votre application (dark/light mode).

## 💡 Astuces

1. **Ordre des champs** : Les champs sont affichés dans l'ordre du tableau
2. **Sections** : Utilisez les sections pour une meilleure organisation
3. **Validation** : Combinez `required` et `validate` pour une validation complète
4. **fullWidth** : Utilisez pour les champs textarea ou descriptions longues
5. **hint** : Ajoutez des indications pour guider l'utilisateur

## 🚨 Gestion des erreurs

Les erreurs de validation sont affichées automatiquement :
- En rouge sous le champ concerné
- Border rouge sur le champ en erreur
- Les erreurs disparaissent dès que l'utilisateur tape

## 📚 Exemple pour d'autres entités

### Managers
```jsx
const managersEditFields = [
  { key: 'name', label: 'Nom', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'region', label: 'Région', type: 'select', options: [...] },
]
```

### Immeubles
```jsx
const immeublesEditFields = [
  { key: 'name', label: 'Nom', type: 'text', required: true },
  { key: 'address', label: 'Adresse', type: 'textarea', fullWidth: true },
  { key: 'floors', label: 'Étages', type: 'number' },
]
```

## 🎉 Résumé

Le système de modal d'édition offre :
- ✅ Une solution clé en main pour l'édition
- ✅ Une configuration simple et intuitive
- ✅ Une validation robuste
- ✅ Un design professionnel
- ✅ Une réutilisabilité maximale

Vous n'avez plus qu'à définir vos champs et le modal s'occupe du reste ! 🚀

