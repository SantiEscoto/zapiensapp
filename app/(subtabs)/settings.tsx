import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../src/services/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Eye, EyeOff } from 'lucide-react-native';
import { Portal, Modal } from 'react-native-paper';
import { FONTS } from '../../src/services/fonts';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { createTheme, themeColors, type ColorTheme } from '../../src/services';
import { languages } from '../../src/services/languages';
import type { Locale } from '../../src/services/translations';

const FLAG_IMAGES: Record<Locale, number> = {
  en: require('../../assets/flags/en.png'),
  es: require('../../assets/flags/es.png'),
  fr: require('../../assets/flags/fr.png'),
  de: require('../../assets/flags/de.png'),
  it: require('../../assets/flags/it.png'),
  pt: require('../../assets/flags/pt.png'),
  ja: require('../../assets/flags/ja.png'),
  zh: require('../../assets/flags/zh.png'),
  ko: require('../../assets/flags/ko.png'),
  ru: require('../../assets/flags/ru.png'),
  kk: require('../../assets/flags/kk.png'),
};

// Add interfaces at the top of the file
interface Errors {
  fullName: string;
  username: string;
  password: string;
  newPassword: string;
  confirmPassword: string;
  [key: string]: string;
}

export default function Settings() {
  const router = useRouter();
  const { theme, toggleTheme, setColorTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [tempTheme, setTempTheme] = useState('default');
  const [tempDarkMode, setTempDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [portalVisible, setPortalVisible] = useState(false);
  const [portalMessage, setPortalMessage] = useState('');
  const [portalTitle, setPortalTitle] = useState('');
  const [profilePortalVisible, setProfilePortalVisible] = useState(false);
  
  // Estado para el perfil
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState<Errors>({
    fullName: '',
    username: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [tempColorTheme, setTempColorTheme] = useState<ColorTheme>(theme.colorTheme);
  const [themePortalVisible, setThemePortalVisible] = useState(false);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [deleteAccountConfirmVisible, setDeleteAccountConfirmVisible] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { locale, setLocale, t } = useLanguage();

  // Crear un tema temporal para previsualización usando useMemo
  const previewTheme = useMemo(() => createTheme(
    tempDarkMode ? 'dark' : 'light',
    tempColorTheme
  ), [tempDarkMode, tempColorTheme]);

  useEffect(() => {
    getProfile();
  }, []);

  useEffect(() => {
    if (themePortalVisible) {
      // Sincronizamos los estados temporales con el tema actual
      setTempDarkMode(theme.type === 'dark');
      setTempColorTheme(theme.colorTheme);
    }
  }, [themePortalVisible, theme]);

  const handleGoBack = () => {
    router.replace('/(main)/profile');
  };

  const toggleDarkMode = () => {
    toggleTheme();
  };

  const handleThemeChange = async (isDark: boolean) => {
    setTempDarkMode(isDark);
    if (isDark !== (theme.type === 'dark')) {
      await toggleTheme();
    }
  };

  const handleColorChange = async (color: ColorTheme) => {
    setTempColorTheme(color);
    if (color !== theme.colorTheme) {
      await setColorTheme(color);
    }
  };

  const applyThemeChanges = () => {
    setThemePortalVisible(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/welcome');
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
      showPortal('Error', 'No se pudo cerrar sesión');
    }
  };

  const showDeleteAccountConfirm = () => setDeleteAccountConfirmVisible(true);
  const hideDeleteAccountConfirm = () => setDeleteAccountConfirmVisible(false);

  const handleDeleteAccountConfirm = async () => {
    setIsDeletingAccount(true);
    try {
      await supabase.auth.signOut();
      setProfilePortalVisible(false);
      setDeleteAccountConfirmVisible(false);
      router.replace('/(auth)/welcome');
    } catch (e) {
      console.error('Error al eliminar cuenta:', e);
      showPortal('Error', 'No se pudo completar la acción');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const navigateToPrivacyPolicy = () => {
    showPortal('Navegación', 'Ir a Política de Privacidad');
  };

  const navigateToTermsOfUse = () => {
    showPortal('Navegación', 'Ir a Términos de Uso');
  };

  const navigateToSupport = () => {
    showPortal('Navegación', 'Ir a Centro de Soporte');
  };

  const showPortal = (title: string, message: string) => {
    setPortalTitle(title);
    setPortalMessage(message);
    setPortalVisible(true);
  };

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, email')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setEmail(data.email || '');
      }
    } catch (error) {
      console.error('Error:', error);
      showPortal('Error', 'Error loading profile');
    }
  }

  const validateInputs = () => {
    const newErrors: Errors = {
      fullName: '',
      username: '',
      password: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    if (fullName.trim().length < 3) {
      newErrors.fullName = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (username.trim().length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    
    if (password && newPassword) {
      if (password.length < 6) {
        newErrors.password = 'La contraseña actual debe tener al menos 6 caracteres';
      }
      if (newPassword.length < 6) {
        newErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).filter(key => newErrors[key] !== '').length === 0;
  };

  async function updateProfile() {
    try {
      if (!validateInputs()) {
        return;
      }
      
      setLoading(true);
      setErrors({
        fullName: '',
        username: '',
        password: '',
        newPassword: '',
        confirmPassword: ''
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update password if provided
      if (password && newPassword && confirmPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match');
        }

        // Verify current password before updating
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (signInError) {
          throw new Error('Current password is incorrect');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) throw passwordError;
      }

      showPortal('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error:', error);
      showPortal('Error', (error as Error).message || 'Ha ocurrido un error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('settings.configuracion')}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settings.cuenta')}</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.card }]} 
            onPress={() => setProfilePortalVisible(true)}
          >
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>{t('settings.editarPerfil')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settings.apariencia')}</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.card }]} 
            onPress={() => setThemePortalVisible(true)}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonLeft}>
                <Ionicons name="color-palette" size={24} color={theme.colors.primary} />
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>{t('settings.temaYColores')}</Text>
              </View>
              <View style={styles.buttonRight}>
                <Text style={[styles.themeText, { color: theme.colors.textSecondary }]}>
                  {theme.type === 'dark' ? t('settings.oscuro') : t('settings.claro')}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.card }]} 
            onPress={() => setLanguageModalVisible(true)}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonLeft}>
                <Ionicons name="language" size={24} color={theme.colors.primary} />
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>{t('settings.idioma')}</Text>
              </View>
              <View style={styles.buttonRight}>
                <Text style={[styles.themeText, { color: theme.colors.textSecondary }]}>
                  {languages.find((l) => l.code === locale)?.name ?? locale}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settings.informacion')}</Text>
          
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.card }]} onPress={navigateToPrivacyPolicy}>
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>{t('settings.politicaPrivacidad')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.card }]} onPress={navigateToTermsOfUse}>
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>{t('settings.terminosUso')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.card }]} onPress={navigateToSupport}>
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>{t('settings.soporte')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            Versión 1.0.0
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.colors.error ?? '#FF4B4B' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>{t('settings.cerrarSesion')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal selector de idioma */}
      <Portal>
        <Modal
          visible={languageModalVisible}
          onDismiss={() => setLanguageModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('settings.idioma')}</Text>
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.languageRow, { borderBottomColor: theme.colors.border }]}
                onPress={() => {
                  setLocale(lang.code as Locale);
                  setLanguageModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Image source={FLAG_IMAGES[lang.code as Locale]} style={styles.flagIcon} resizeMode="contain" />
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>{lang.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setLanguageModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </Modal>
      </Portal>

      {/* Portal para mensajes generales */}
      <Portal>
        <Modal
          visible={portalVisible}
          onDismiss={() => setPortalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }]}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{portalTitle}</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>{portalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setPortalVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>

      {/* Portal para edición de perfil */}
      <Portal>
        <Modal
          visible={profilePortalVisible}
          onDismiss={() => setProfilePortalVisible(false)}
          contentContainerStyle={[styles.profileModalContainer, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }]}>
          <ScrollView style={styles.profileModalContent}>
            <View style={styles.profileModalHeader}>
              <Text style={[styles.profileModalTitle, { color: theme.colors.text }]}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setProfilePortalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Nombre Completo</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }, errors.fullName ? styles.inputError : null]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ingresa tu nombre completo"
                placeholderTextColor={theme.colors.textSecondary}
              />
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Nombre de Usuario</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }, errors.username ? styles.inputError : null]}
                value={username}
                onChangeText={setUsername}
                placeholder="Ingresa tu nombre de usuario"
                placeholderTextColor={theme.colors.textSecondary}
              />
              {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Ingresa tu email"
                placeholderTextColor={theme.colors.textSecondary}
                editable={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Contraseña Actual</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }, errors.password ? styles.inputError : null]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ingresa tu contraseña actual"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={24} color={theme.colors.textSecondary} /> : <Eye size={24} color={theme.colors.textSecondary} />}
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Nueva Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }, errors.newPassword ? styles.inputError : null]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Ingresa tu nueva contraseña"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={24} color={theme.colors.textSecondary} /> : <Eye size={24} color={theme.colors.textSecondary} />}
                </TouchableOpacity>
              </View>
              {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Confirmar Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }, errors.confirmPassword ? styles.inputError : null]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirma tu nueva contraseña"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={24} color={theme.colors.textSecondary} /> : <Eye size={24} color={theme.colors.textSecondary} />}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            <TouchableOpacity 
              style={[styles.updateButton, loading && styles.updateButtonDisabled, { backgroundColor: theme.colors.primary }]}
              onPress={updateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.updateButtonText}>Actualizar Perfil</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteAccountButton, { borderColor: theme.colors.error ?? '#FF4B4B' }]}
              onPress={showDeleteAccountConfirm}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.error ?? '#FF4B4B'} />
              <Text style={[styles.deleteAccountButtonText, { color: theme.colors.error ?? '#FF4B4B' }]}>
                Eliminar cuenta
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal de confirmación para eliminar cuenta */}
      <Portal>
        <Modal
          visible={deleteAccountConfirmVisible}
          onDismiss={hideDeleteAccountConfirm}
          contentContainerStyle={[styles.modalContainer, {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border
          }]}
        >
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Eliminar cuenta</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
              Se borrará toda tu información y tu cuenta de forma permanente. Esta acción no se puede deshacer.{'\n\n'}¿Estás seguro?
            </Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.colors.border }]}
                onPress={hideDeleteAccountConfirm}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.colors.error ?? '#FF4B4B' }]}
                onPress={handleDeleteAccountConfirm}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Portal para tema y colores */}
      <Portal>
        <Modal
          visible={themePortalVisible}
          onDismiss={() => setThemePortalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: previewTheme.colors.card, borderColor: previewTheme.colors.border }]}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: previewTheme.colors.text }]}>Tema y Colores</Text>
              <TouchableOpacity onPress={() => setThemePortalVisible(false)}>
                <Ionicons name="close" size={24} color={previewTheme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.themeSection}>
              <Text style={[styles.sectionTitle, { color: previewTheme.colors.text }]}>Modo</Text>
              <View style={styles.themeModesContainer}>
                <TouchableOpacity 
                  style={[
                    styles.themeModeOption,
                    !tempDarkMode && styles.themeModeSelected,
                    { backgroundColor: !tempDarkMode ? '#FFA500' : previewTheme.colors.card }
                  ]}
                  onPress={() => handleThemeChange(false)}
                >
                  <View style={styles.themeModeContent}>
                    <Ionicons 
                      name="sunny" 
                      size={24} 
                      color={!tempDarkMode ? '#FFFFFF' : previewTheme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.themeModeText,
                      { color: !tempDarkMode ? '#FFFFFF' : previewTheme.colors.textSecondary }
                    ]}>
                      DAYMODE
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.themeModeOption,
                    tempDarkMode && styles.themeModeSelected,
                    { backgroundColor: tempDarkMode ? '#1F2937' : previewTheme.colors.card }
                  ]}
                  onPress={() => handleThemeChange(true)}
                >
                  <View style={styles.themeModeContent}>
                    <Ionicons 
                      name="moon" 
                      size={24} 
                      color={tempDarkMode ? '#FFFFFF' : previewTheme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.themeModeText,
                      { color: tempDarkMode ? '#FFFFFF' : previewTheme.colors.textSecondary }
                    ]}>
                      NIGHTMODE
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.themeSection}>
              <Text style={[styles.sectionTitle, { color: previewTheme.colors.text }]}>Color Principal</Text>
              <View style={styles.themeContainer}>
                {(['ocean', 'royal', 'forest', 'citrus', 'cherry', 'candy'] as const).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.themeColorColumn}
                    onPress={() => handleColorChange(key)}
                  >
                    <View
                      style={[
                        styles.colorOption,
                        tempColorTheme === key && styles.selectedColor,
                        { backgroundColor: themeColors[key] }
                      ]}
                    />
                    <Text style={[styles.themeLabel, { color: previewTheme.colors.textSecondary }]}>
                      {({ ocean: 'Ocean', royal: 'Royal', forest: 'Forest', citrus: 'Citrus', cherry: 'Cherry', candy: 'Candy' } as const)[key]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.applyButton, 
                { backgroundColor: previewTheme.colors.primary }
              ]}
              onPress={applyThemeChanges}
            >
              <Text style={styles.applyButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontFamily: FONTS.body,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  modalButton: {
    backgroundColor: '#FF8C00', // fallback (normalmente se overridea con theme.colors.*)
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  flagIcon: {
    width: 28,
    height: 20,
    marginRight: 12,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 28,
    marginLeft: 10,
    fontFamily: FONTS.title,
  },
  section: {
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 20,
    fontFamily: FONTS.title,
  },
  formGroup: {
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: FONTS.body,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: FONTS.body,
    width: '100%',
  },
  darkInput: {
    backgroundColor: '#1E2A30',
    color: '#FFFFFF',
    borderColor: '#37464f',
  },
  lightInput: {
    backgroundColor: '#F2F2F7',
    color: '#000000',
    borderColor: '#C7C7CC',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
    fontFamily: FONTS.body,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  themeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 4,
  },
  themeColorColumn: {
    alignItems: 'center',
    minWidth: 50,
  },
  themeLabel: {
    fontSize: 10,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginTop: 4,
  },
  themeOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTheme: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  button: {
    backgroundColor: "#37464f",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  versionText: {
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    marginTop: 24,
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {},
  confirmButton: {},
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  profileModalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  profileModalContent: {
    width: '100%',
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileModalTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
  },
  themeOptionText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    marginRight: 8,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    marginRight: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  themeSection: {
    width: '100%',
    marginBottom: 24,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  applyButton: {
    backgroundColor: '#FF8C00', // fallback (se overridea con previewTheme.colors.primary)
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  themeModesContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  themeModeOption: {
    borderRadius: 30,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeModeSelected: {
    borderColor: '#FFFFFF',
  },
  themeModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  themeModeText: {
    fontSize: 16,
    fontFamily: FONTS.title,
  },
});