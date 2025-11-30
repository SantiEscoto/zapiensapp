import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../src/services/supabase';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Modal } from 'react-native-paper';
import { FONTS, FONT_ASSETS } from '../../src/services/fonts';
import { useTheme } from '../../src/context/ThemeContext';
import { createTheme } from '../../src/services';

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
  const [loaded] = useFonts(FONT_ASSETS);

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

  const [tempColorTheme, setTempColorTheme] = useState<'default' | 'green' | 'purple' | 'orange'>(theme.colorTheme);
  const [themePortalVisible, setThemePortalVisible] = useState(false);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

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

  if (!loaded) {
    return null;
  }

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

  const handleColorChange = async (color: 'default' | 'green' | 'purple' | 'orange') => {
    setTempColorTheme(color);
    if (color !== theme.colorTheme) {
      await setColorTheme(color);
    }
  };

  const applyThemeChanges = () => {
    setThemePortalVisible(false);
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
          <Text style={[styles.title, { color: theme.colors.text }]}>Configuración</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cuenta</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.card }]} 
            onPress={() => setProfilePortalVisible(true)}
          >
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>Editar Perfil</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Apariencia</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.card }]} 
            onPress={() => setThemePortalVisible(true)}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonLeft}>
                <Ionicons name="color-palette" size={24} color={theme.colors.primary} />
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>Tema y Colores</Text>
              </View>
              <View style={styles.buttonRight}>
                <Text style={[styles.themeText, { color: theme.colors.textSecondary }]}>
                  {theme.type === 'dark' ? 'Oscuro' : 'Claro'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Información</Text>
          
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.card }]} onPress={navigateToPrivacyPolicy}>
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>Política de Privacidad</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.card }]} onPress={navigateToTermsOfUse}>
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>Términos de Uso</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.card }]} onPress={navigateToSupport}>
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>Centro de Ayuda y Feedback</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            Versión 1.0.0
          </Text>
        </View>
      </ScrollView>

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
                  <Image 
                    source={showPassword ? require('../../assets/pw1.png') : require('../../assets/pw0.png')} 
                    style={styles.eyeIcon}
                  />
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
                  <Image 
                    source={showNewPassword ? require('../../assets/pw1.png') : require('../../assets/pw0.png')} 
                    style={styles.eyeIcon}
                  />
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
                  <Image 
                    source={showConfirmPassword ? require('../../assets/pw1.png') : require('../../assets/pw0.png')} 
                    style={styles.eyeIcon}
                  />
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
          </ScrollView>
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
                <TouchableOpacity 
                  style={[
                    styles.colorOption, 
                    tempColorTheme === 'default' && styles.selectedColor,
                    { backgroundColor: '#1CB0F6' }
                  ]}
                  onPress={() => handleColorChange('default')}
                />
                <TouchableOpacity 
                  style={[
                    styles.colorOption, 
                    tempColorTheme === 'green' && styles.selectedColor,
                    { backgroundColor: '#58CC02' }
                  ]}
                  onPress={() => handleColorChange('green')}
                />
                <TouchableOpacity 
                  style={[
                    styles.colorOption, 
                    tempColorTheme === 'purple' && styles.selectedColor,
                    { backgroundColor: '#8549BA' }
                  ]}
                  onPress={() => handleColorChange('purple')}
                />
                <TouchableOpacity 
                  style={[
                    styles.colorOption, 
                    tempColorTheme === 'orange' && styles.selectedColor,
                    { backgroundColor: '#FF9600' }
                  ]}
                  onPress={() => handleColorChange('orange')}
                />
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
    fontFamily: FONTS.bold,
    fontSize: 20,
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  modalButton: {
    backgroundColor: '#1CB0F6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
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
    fontFamily: FONTS.bold,
  },
  section: {
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 20,
    fontFamily: FONTS.bold,
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
    fontFamily: FONTS.regular,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.bold,
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
    fontFamily: FONTS.regular,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  eyeIcon: {
    width: 24,
    height: 24,
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
    fontFamily: FONTS.bold,
    fontSize: 24,
  },
  themeOptionText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.regular,
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
    borderColor: '#666666',
    borderWidth: 3,
  },
  applyButton: {
    backgroundColor: '#1CB0F6',
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
    fontFamily: FONTS.bold,
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
    fontFamily: FONTS.bold,
  },
});