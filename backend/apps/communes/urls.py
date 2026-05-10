from django.urls import path
from .views import (
    CommuneListView, CommuneDetailView, CommuneAdminView, CommuneAdminDetailView,
    ConfirmerDotationView, ProjetListView, ProjetDetailView
)

urlpatterns = [
    path("", CommuneListView.as_view(), name="communes-list"),
    path("<int:pk>/", CommuneDetailView.as_view(), name="communes-detail"),
    path("admin/", CommuneAdminView.as_view(), name="communes-admin-list"),
    path("admin/<int:pk>/", CommuneAdminDetailView.as_view(), name="communes-admin-detail"),
    path("admin/<int:pk>/confirmer-dotation/", ConfirmerDotationView.as_view(), name="commune-confirmer-dotation"),
    path("projets/", ProjetListView.as_view(), name="projets-list"),

    path("projets/<int:pk>/", ProjetDetailView.as_view(), name="projets-detail"),
]
