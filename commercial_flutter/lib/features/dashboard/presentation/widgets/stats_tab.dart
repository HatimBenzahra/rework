import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/commercial.dart';
import '../../../../core/models/statistic.dart';
import '../../../../shared/widgets/stat_card.dart';

/// Onglet statistiques du dashboard
/// Basé sur le contenu 'stats' de CommercialDashboard.jsx
class StatsTab extends StatelessWidget {
  final Commercial? commercial;
  final Statistic? stats;

  const StatsTab({
    super.key,
    required this.commercial,
    required this.stats,
  });

  @override
  Widget build(BuildContext context) {
    final myStats = stats ?? _getDefaultStats();

    return SingleChildScrollView(
      child: Column(
        children: [
          // Grille des statistiques principales
          _buildStatsGrid(myStats),

          const SizedBox(height: 24),

          // Carte de performance mensuelle
          _buildPerformanceCard(myStats, context),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(Statistic stats) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        StatCard(
          title: 'Contrats signés',
          value: stats.contratsSignes.toString(),
          icon: Icons.check_circle,
          trend: 15, // TODO: Calculer la vraie tendance
          color: AppColors.success,
        ),
        StatCard(
          title: 'Immeubles visités',
          value: stats.immeublesVisites.toString(),
          icon: Icons.business,
          trend: 8,
          color: AppColors.primary,
        ),
        StatCard(
          title: 'Rendez-vous pris',
          value: stats.rendezVousPris.toString(),
          icon: Icons.schedule,
          trend: -3,
          color: AppColors.warning,
        ),
        StatCard(
          title: 'Taux de refus',
          value: '${stats.tauxRefus.toStringAsFixed(1)}%',
          icon: Icons.trending_up,
          color: AppColors.neutral,
        ),
      ],
    );
  }

  Widget _buildPerformanceCard(Statistic stats, BuildContext context) {
    final objectifMensuel = 25;
    final progressPercentage = (stats.contratsSignes / objectifMensuel * 100).clamp(0, 100);

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Performance mensuelle',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),

            const SizedBox(height: 20),

            // Objectif mensuel
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Objectif mensuel',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.borderDefault),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '$objectifMensuel contrats',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Barre de progression
            Container(
              width: double.infinity,
              height: 8,
              decoration: BoxDecoration(
                color: AppColors.neutralLight,
                borderRadius: BorderRadius.circular(4),
              ),
              child: FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: progressPercentage / 100,
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Texte de progression
            Text(
              '${stats.contratsSignes} / $objectifMensuel contrats',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textMuted,
              ),
            ),

            const SizedBox(height: 16),

            // Informations supplémentaires
            if (progressPercentage >= 100)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.success.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.celebration,
                      color: AppColors.success,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Félicitations ! Objectif mensuel atteint !',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.success,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              )
            else if (progressPercentage >= 80)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.warningLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.warning.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.trending_up,
                      color: AppColors.warning,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Excellent ! Plus que quelques contrats pour atteindre l\'objectif !',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.warning,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Statistic _getDefaultStats() {
    return Statistic(
      id: 0,
      contratsSignes: 0,
      immeublesVisites: 0,
      rendezVousPris: 0,
      refus: 0,
      periode: DateTime.now(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      commercialId: 0,
    );
  }
}
