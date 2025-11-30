import React, { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Portal, Modal } from 'react-native-paper';
import { supabase } from '../../src/services/supabase';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { FONTS, FONT_ASSETS } from '../../src/services/fonts';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';


interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  email: string;
  followers_ids?: string[];
  following_ids?: string[];
  weekly_xp?: number;
}

export default function Perfil() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [portalVisible, setPortalVisible] = useState(false);
  const [portalMessage, setPortalMessage] = useState('');
  const [portalTitle, setPortalTitle] = useState('');
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [weeklyXP, setWeeklyXP] = useState<number>(0);
  const [weeklyProgress, setWeeklyProgress] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]); // For L,M,M,J,V,S,D
  const [chartWidth, setChartWidth] = useState(0);
  const [chartHeight, setChartHeight] = useState(0);
  const [maxXP, setMaxXP] = useState<number>(750); // Valor por defecto

  const [loaded] = useFonts(FONT_ASSETS);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session);
      }
    });
  }, []);

  // Efecto para actualizar maxXP cuando cambie weeklyProgress
  useEffect(() => {
    const calculatedMaxXP = calculateMaxXP(weeklyProgress);
    console.log('Actualizando maxXP desde useEffect:', calculatedMaxXP);
    setMaxXP(calculatedMaxXP);
  }, [weeklyProgress]);

  async function fetchProfile(session: Session) {
    try {
      setIsLoading(true);
      if (!session?.user) throw new Error('No user on the session!');
  
      // First query the basic profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, email, weekly_xp, daily_xp_history')
        .eq('id', session.user.id)
        .single();
  
      if (error) throw error;
      
      // Then get followers/following in separate queries (optional)
      let followers_ids: string[] = [];
      let following_ids: string[] = [];
      
      try {
        // Get followers count using array containment operator
        const { count: followersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .contains('following_ids', [session.user.id]);

        // Get following from array column
        const { data: followingData } = await supabase
          .from('profiles')
          .select('following_ids')
          .eq('id', session.user.id)
          .single();

        const { data: followersData } = await supabase
          .from('profiles')
          .select('id')
          .contains('following_ids', [session.user.id]);

        followers_ids = followersData?.map(user => user.id) || [];
        if (followersData) {
          followers_ids = followersData.map(user => user.id);
        }

        if (followingData?.following_ids) {
          following_ids = Array.isArray(followingData.following_ids)
            ? followingData.following_ids
            : [];
        }
      } catch (e) {
        // Silently handle errors for follower data
        console.warn('Could not fetch follower data:', e);
      }
      
      // Set the complete profile
      if (data) {
        setProfile({
          ...data,
          followers_ids,
          following_ids
        });
        
        // Update weekly XP
        if (data.weekly_xp !== undefined) {
          setWeeklyXP(data.weekly_xp);
        }
        
        // Process daily XP history for the chart
        if (data.daily_xp_history) {
          const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          const progressData = dayOrder.map(day => {
            return parseInt(data.daily_xp_history[day] || 0);
          });
          console.log('Datos de progreso:', progressData);
          setWeeklyProgress(progressData);
          
          // Calcular y establecer el maxXP basado en el progreso
          const calculatedMaxXP = calculateMaxXP(progressData);
          console.log('MaxXP calculado:', calculatedMaxXP);
          setMaxXP(calculatedMaxXP);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!loaded) return null;

  const navigateToSettings = () => {
    router.push('/(subtabs)/settings');
  };

  const navigateToFriends = () => {
    router.push('/(subtabs)/friends');
  };

  const showLogoutConfirmation = () => {
    setLogoutConfirmVisible(true);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error:', error);
      setPortalTitle('Error');
      setPortalMessage('Failed to log out');
      setPortalVisible(true);
    }
    setLogoutConfirmVisible(false);
  };

  // Función para calcular el límite dinámico de XP
  const calculateMaxXP = (progress: number[]) => {
    const maxProgress = Math.max(...progress);
    console.log('Progreso máximo:', maxProgress);
    if (maxProgress === 0) return 750; // Si no hay progreso, usar valor por defecto
    
    // Redondear al siguiente múltiplo de 50
    const roundedMax = Math.ceil(maxProgress / 50) * 50;
    console.log('Máximo redondeado:', roundedMax);
    return roundedMax;
  };

  // Función para obtener los valores del eje Y
  const getYAxisValues = (max: number) => {
    // Dividir el máximo en 3 partes iguales y redondear cada una a múltiplos de 50
    const step = Math.ceil(max / 3 / 50) * 50;
    console.log('Paso calculado:', step);
    const values = [
      max,
      step * 2,
      step,
      0
    ];
    console.log('Valores del eje Y:', values);
    return values;
  };

  return (
    <>
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={navigateToSettings} style={styles.settingsIconButton}>
            <Image 
              source={require('../../assets/icons/gear.png')} 
              style={[styles.settingsIcon, { tintColor: theme.colors.text }]} 
            />
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <View style={styles.profileContainer}>
            <Image
              source={
                profile?.avatar_url
                  ? { uri: profile.avatar_url }
                  : require('../../assets/user.png')
              }
              style={styles.avatar}
            />
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {profile?.full_name || profile?.username || 'User'}
            </Text>
            <Text style={[styles.username, { color: theme.colors.textSecondary }]}>@{profile?.username || 'user'}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statColumn}>
                <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                  {(profile?.followers_ids && profile.followers_ids.length) || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Followers</Text>
              </View>
              <View style={styles.statColumn}>
                <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                  {(profile?.following_ids && profile.following_ids.length) || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Following</Text>
              </View>
            </View>
            
            <View style={[styles.weeklyProgressContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.weeklyProgressHeader}>
                <Text style={[styles.weeklyProgressTitle, { color: theme.colors.text }]}>Progreso semanal</Text>
                <Text style={[styles.weeklyProgressValue, { color: theme.colors.primary }]}>{weeklyXP} EXP</Text>
              </View>
              <View style={styles.chartContainer}>
                <View style={styles.yAxisLabels}>
                  {getYAxisValues(maxXP).map((value, index) => (
                    <Text key={index} style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>{value}</Text>
                  ))}
                </View>
                <View style={styles.chartContent}>
                  <View style={[styles.horizontalLine, { backgroundColor: theme.colors.border }]} />
                  <View style={[styles.horizontalLine, { top: 50, backgroundColor: theme.colors.border }]} />
                  <View style={[styles.horizontalLine, { top: 100, backgroundColor: theme.colors.border }]} />
                  <View 
                    style={styles.lineChart}
                    onLayout={(event) => {
                      const { width, height } = event.nativeEvent.layout;
                      setChartWidth(width);
                      setChartHeight(height);
                    }}
                  >
                    {chartWidth > 0 && chartHeight > 0 && (
                      <>
                        <Svg width={chartWidth} height={chartHeight}>
                          <Path
                            d={(() => {
                              const points = weeklyProgress.map((value, index) => {
                                const x = (index * (chartWidth - 40)) / 6 + 20;
                                const y = chartHeight - (Math.min((value / maxXP) * (chartHeight - 30), chartHeight - 30)) - 6;
                                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                              }).join(' ');
                              return points;
                            })()}
                            stroke={theme.colors.primary}
                            strokeWidth="2"
                            fill="none"
                          />
                        </Svg>
                        {weeklyProgress.map((value, index) => {
                          const x = (index * (chartWidth - 40)) / 6 + 20;
                          const y = chartHeight - (Math.min((value / maxXP) * (chartHeight - 30), chartHeight - 30)) - 6;
                          
                          return (
                            <View 
                              key={index} 
                              style={[
                                styles.dataPointContainer,
                                { 
                                  left: x - 20,
                                  height: chartHeight
                                }
                              ]}
                            >
                              <View 
                                style={[
                                  styles.dataPoint, 
                                  { 
                                    top: y - 3,
                                    backgroundColor: theme.colors.primary
                                  }
                                ]}
                              />
                              <Text style={[styles.xAxisLabel, { color: theme.colors.textSecondary }]}>
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}
                              </Text>
                            </View>
                          );
                        })}
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.addFriendsButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
              onPress={navigateToFriends}
            >
              <View style={styles.buttonContent}>
                <Image 
                  source={require('../../assets/icons/add_friend.png')} 
                  style={[styles.buttonIcon, { tintColor: '#FFFFFF' }]} 
                />
                <Text style={styles.buttonText}>ADD FRIENDS</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.logoutButton, { backgroundColor: theme.colors.error, shadowColor: theme.colors.error }]}
              onPress={showLogoutConfirmation}
            >
              <Text style={styles.buttonText}>CERRAR SESIÓN</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
    <Portal>
      <Modal
        visible={logoutConfirmVisible}
        onDismiss={() => setLogoutConfirmVisible(false)}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      >
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Confirmar</Text>
          <Text style={[styles.modalMessage, { color: theme.colors.text }]}>¿Estás seguro que deseas cerrar sesión?</Text>
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.colors.border }]}
              onPress={() => setLogoutConfirmVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleLogout}
            >
              <Text style={styles.modalButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    marginBottom: 20,
  },
  settingsIconButton: {
    padding: 10,
  },
  settingsIcon: {
    width: 28,  
    height: 28, // Changed from 24
    tintColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontFamily: 'DINNextRoundedLTPro-Bold',
    color: '#FFFFFF',
  },
  addFriendsButton: {
    backgroundColor: '#1CB0F6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#1691C9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  logoutButton: {
    backgroundColor: '#FF4B4B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    shadowColor: '#CC3C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    tintColor: '#FFFFFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  modalContainer: {
    backgroundColor: '#202f36',
    margin: 20,
    borderRadius: 14,
    padding: 20,
    borderWidth: 2,
    borderColor: '#37464f',
  },
  modalContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'DINNextRoundedLTPro-Bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'DINNextRoundedLTPro-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#1CB0F6',
    borderRadius: 14,
    padding: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#37464f',
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
    gap: 40,
  },
  statColumn: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'DINNextRoundedLTPro-Bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'DINNextRoundedLTPro-Regular',
    color: '#A0AEC0',
    marginTop: 4,
  },
  username: {
    fontSize: 16,
    fontFamily: 'DINNextRoundedLTPro-Regular',
    color: '#A0AEC0',
    marginBottom: 8,
  },
  weeklyProgressContainer: {
    backgroundColor: '#202f36',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    width: '100%',
    borderWidth: 2,
    borderColor: '#37464f',
  },
  weeklyProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyProgressTitle: {
    fontSize: 18,
    fontFamily: 'DINNextRoundedLTPro-Bold',
    color: '#FFFFFF',
  },
  weeklyProgressValue: {
    fontSize: 18,
    fontFamily: 'DINNextRoundedLTPro-Bold',
    color: '#1CB0F6',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginTop: 4,
    paddingTop: 16,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    marginRight: 8,
    height: 150,
    marginTop: 16,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'right',
  },
  chartContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    position: 'relative',
    marginTop: 8,
  },
  lineChart: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  chartLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 30,
    height: '100%'
  },
  dataPointContainer: {
    alignItems: 'center',
    width: 40,
    position: 'absolute',
  },
  dataPoint: {
    width: 6,
    height: 6,
    backgroundColor: '#1CB0F6',
    borderRadius: 3,
    position: 'absolute',
    bottom: 30
  },
  xAxisLabel: {
    fontSize: 12,
    color: '#A0AEC0',
    position: 'absolute',
    top: -16,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  horizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#37464f',
  }
});